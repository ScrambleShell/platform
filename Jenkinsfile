properties([disableConcurrentBuilds()])

// 3
node("dind") {
    // If not in a PR and not in master branch, discard the build
    // if (!env.CHANGE_TARGET && env.BRANCH_NAME != "master") {
    //   echo "Skip CI for branch different than master and not in a PR"
    //   return
    // }
    container('dind') {
        compat.test_build()
    }
}
