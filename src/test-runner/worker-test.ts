namespace SplitTime.testRunner {
    declare function postMessage(message: any): void

    defer(() => {
        const tests = SplitTime.test.getScenarios();
        const testHelper = new ExceptionTestHelper()
        function runTest(index: int): TestResult {
            try {
                tests[index].definition(testHelper)
                return new TestResult(index, true)
            } catch(e) {
                return new TestResult(index, false, e.message)
            }
        }
    
        // If we run in a WebWorker, add some message handlers
        if(__WORKER__) {
            onmessage = function(message) {
                for(const i of message.data) {
                    const result = runTest(i)
                    postMessage(result)
                }
            }
        }
    })
}