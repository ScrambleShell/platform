from(db:"test")
  |> range(start:-5m)
  |> filter(fn: (r) => r._value / 0.0 > 20)
