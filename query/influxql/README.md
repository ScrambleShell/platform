# InfluxQL Transpiler

The InfluxQL Transpiler exists to rewrite an InfluxQL query into its equivalent query in Flux. The transpiler works off of a few simple rules that match with the equivalent method of constructing queries in InfluxDB.

**NOTE:** The transpiler code is not finished and may not necessarily reflect what is in this document. When they conflict, this document is considered to be the correct way to do it. If you wish to change how the transpiler works, modify this file first.

1. [Identify the cursors](#identify-cursors)
2. [Identify the query type](#identify-query-type)
3. [Processing Meta Queries](#process-meta-queries)
    1. [Processing SHOW TAG VALUES](#process-show-tag-values)
4. [Processing Data Queries](#process-data-queries)
    1. [Group the cursors](#group-cursors)
    2. [Create the cursors for each group](#create-groups)
        1. [Create cursor](#create-cursor)
        2. [Filter by measurement and fields](#filter-cursor)
        3. [Generate the pivot table](#generate-pivot-table)
        4. [Evaluate the condition](#evaluate-condition)
        5. [Perform the grouping](#perform-grouping)
        6. [Evaluate the function](#evaluate-function)
        7. [Normalize the time column](#normalize-time)
        8. [Combine windows](#combine-windows)
    5. [Join the groups](#join-groups)
    6. [Map and eval columns](#map-and-eval)
5. [Encoding the results](#encoding)

## <a name="identify-cursors"></a> Identify the cursors

The InfluxQL query engine works by filling in variables and evaluating the query for the values in each row. The first step of transforming a query is identifying the cursors so we can figure out how to fill them correctly. A cursor is any point in the query that has a **variable or a function call**. Math functions do not count as function calls and are handled in the eval phase.

For the following query, it is easy to identify the cursors:

    SELECT max(usage_user), usage_system FROM telegraf..cpu

`max(usage_user)` and `usage_system` are the cursors that we need to fill in for each row. Cursors are global and are not per-field.

## <a name="identify-query-type"></a> Identify the query type

There are four types of queries: meta, raw, aggregate, and selector. A meta query is one that retrieves descriptive information about a measurement or series, rather than about the data within the measurement or series. A raw query is one where all of the cursors reference a variable. An aggregate is one where all of the cursors reference a function call. A selector is one where there is exactly one function call that is a selector (such as `max()` or `min()`) and the remaining variables, if there are any, are variables. If there is only one function call with no variables and that function is a selector, then the function type is a selector.

# <a name="process-meta-queries"></a>Processing Meta Queries 

## <a name="process-show-tag-values"></a>Processing SHOW TAG VALUES
Show tag values has the full form: 

```
SHOW TAG VALUES 
  [ON <database_name>]
  [FROM <measurement>] 
  WITH KEY [ [<operator> "<tag_key>" | <regular_expression>] | [IN ("<tag_key1>","<tag_key2")]] 
  [WHERE <tag_key> <operator> ['<tag_value>' | <regular_expression>]] 
  [LIMIT_clause] 
  [OFFSET_clause]
```

In flux, for a single `<tag key>`, we can get the tag values: 
```  
from(db:<database_name>)
         |> range(start:<start>)
         |> filter(fn:(r) => r._measurement == <measurement>)
         |> group(by:[<tag_key>])
         |> distinct(column:<tag_key>)
         |> group(none:true)
```

TODO: In some cases `<tag_key>` is instead a set identified by a regex or IN clause.  Need to determine the best way to 
issue a query to get the values for multiple tag keys.  The trivial solution is to issue and yield multiple queries. 

TODO: supporting `<regular_expression>` filters will require some kind of language support since the transpiler is not 
schema-aware.  

# <a name="process-data-queries"></a>Processing Data Queries
## <a name="group-cursors"></a> Group the cursors

We group the cursors based on the query type. For raw queries and selectors, all of the cursors are put into the same group. For aggregates, each function call is put into a separate group so they can be joined at the end.

## <a name="create-groups"></a> Create the cursors for each group

We create the cursors within each group. This process is repeated for every group.

### <a name="create-cursor"></a> Create cursor

The cursor is generated using the following template:

    create_cursor = (db, rp="autogen", start, stop=now()) => from(bucket: db+"/"+rp)
        |> range(start: start, stop: stop)

This is called once per group.

### <a name="identify-variables"></a> Identify the variables

Each of the variables in the group are identified. This involves inspecting the condition to collect the common variables in the expression while also retrieving the variables for each expression within the group. For a function call, this retrieves the variable used as a function argument rather than the function itself.

If a wildcard is identified in the fields, then the field filter is cleared and only the measurement filter is used. If a regex wildcard is identified, it is added as one of the field filters.

### <a name="filter-cursor"></a> Filter by measurement and fields

A filter expression is generated by using the measurement and the fields that were identified. It follows this template:

    ... |> filter(fn: (r) => r._measurement == <measurement> and <field_expr>)

The `<measurement>` is equal to the measurement name from the `FROM` clause. The `<field_expr>` section is generated differently depending on the fields that were found. If more than one field was selected, then each of the field filters is combined by using `or` and the expression itself is surrounded by parenthesis. For a non-wildcard field, the following expression is used:

    r._field == <name>

For a regex wildcard, the following is used:

    r._field =~ <regex>

If a star wildcard was used, the `<field_expr>` is omitted from the filter expression.

### <a name="generate-pivot-table"></a> Generate the pivot table

If there was more than one field selected or if one of the fields was some form of wildcard, a pivot expression is generated.

    ... |> pivot(rowKey: ["_time"], colKey: ["_field"], valueCol: "_value")

### <a name="evaluate-condition"></a> Evaluate the condition

At this point, generate the `filter` call to evaluate the condition. If there is no condition outside of the time selector, then this step is skipped.

### <a name="perform-grouping"></a> Perform the grouping

We group together the streams based on the `GROUP BY` clause. As an example:

    > SELECT mean(usage_user) FROM telegraf..cpu WHERE time >= now() - 5m GROUP BY time(5m), host
    ... |> group(by: ["_measurement", "_start", "host"]) |> window(every: 5m)

If the `GROUP BY time(...)` doesn't exist, `window()` is skipped. Grouping will have a default of [`_measurement`, `_start`], regardless of whether a GROUP BY clause is present.
If there are keys in the group by clause, they are concatenated with the default list. If a wildcard is used for grouping, then this step is skipped. 

### <a name="evaluate-function"></a> Evaluate the function

If this group contains a function call, the function is evaluated at this stage and invoked on the specific column. As an example:

    > SELECT max(usage_user), usage_system FROM telegraf..cpu
    val1 = create_cursor(bucket: "telegraf/autogen", start: -5m, m: "cpu", f: "usage_user")
    val1 = create_cursor(bucket: "telegraf/autogen", start: -5m, m: "cpu", f: "usage_system")
    inner_join(tables: {val1: val1, val2: val2}, except: ["_field"], fn: (tables) => {val1: tables.val1, val2: tables.val2})
        |> max(column: "val1")

For an aggregate, the following is used instead:

    > SELECT mean(usage_user) FROM telegraf..cpu
    create_cursor(bucket: "telegraf/autogen", start: -5m, m: "cpu", f: "usage_user")
        |> group(except: ["_field"])
        |> mean(timeSrc: "_start", columns: ["_value"])

If the aggregate is combined with conditions, the column name of `_value` is replaced with whatever the generated column name is.

### <a name="normalize-time"></a> Normalize the time column

If a function was evaluated and the query type is an aggregate type, then all of the selector functions need to have their time normalized.

    ... |> max() |> drop(columns: ["_time"]) |> duplicate(column: "_start", as: "_time")

This **only gets applied to selectors when being run as an aggregate**. This step is skipped if the query is running as a selector and it does not apply when processing raw data.

### <a name="combine-windows"></a> Combine windows

If there a window operation was added, we then combine each of the function results from the windows back into a single table.

    ... |> window(every: inf)

This step is skipped if there was no window function.

## <a name="join-groups"></a> Join the groups

If there is only one group, this does not need to be done and can be skipped.

If there are multiple groups, as is the case when there are multiple function calls, then we perform an `outer_join` using the time and any remaining group keys.

## <a name="map-and-eval"></a> Map and eval the columns

After joining the results if a join was required, then a `map` call is used to both evaluate the math functions and name the columns. The time is also passed through the `map()` function so it is available for the encoder.

    result |> map(fn: (r) => {_time: r._time, max: r.val1, usage_system: r.val2})

This is the final result. It will also include any tags in the group key and the time will be located in the `_time` variable.

TODO(jsternberg): The `_time` variable is only needed for selectors and raw queries. We can actually drop this variable for aggregate queries and use the `_start` time from the group key. Consider whether or not we should do this and if it is worth it.

## <a name="encoding"></a> Encoding the results

Each statement will be terminated by a `yield()` call. This call will embed the statement id as the result name. The result name is always of type string, but the transpiler will encode an integer in this field so it can be parsed by the encoder. For example:

    result |> yield(name: "0")

The edge nodes from the query specification will be used to encode the results back to the user in the JSON format used in 1.x. The JSON format from 1.x is below:

    {
        "results": [
            {
                "statement_id": 0,
                "series": [
                    {
                        "name": "_measurement",
                        "tags": {
                            "key": "value"
                        },
                        "columns": [
                            "time",
                            "value"
                        ],
                        "values": [
                            [
                                "2015-01-29T21:55:43.702900257Z",
                                2
                            ]
                        ]
                    }
                ]
            }
        ]
    }

The measurement name is retrieved from the `_measurement` column in the results. For the tags, the values in the group key that are of type string are included with both the keys and the values mapped to each other. Any values in the group key that are not strings, like the start and stop times, are ignored and discarded. If the `_field` key is still present in the group key, it is also discarded. For all normal fields, they are included in the array of values for each row. The `_time` field will be renamed to `time` (or whatever the time alias is set to by the query).

The chunking options that existed in 1.x are not supported by the encoder and should not be used. To minimize the amount of breaking code, using a chunking option will be ignored and the encoder will operate as normal, but it will include a message in the result so that a user can be informed that an invalid query option was used. The 1.x format has a field for sending back informational messages in it already.

**TODO(jsternberg):** Find a way for a column to be both used as a tag and a field. This is not currently possible because the encoder can't tell the difference between the two.
