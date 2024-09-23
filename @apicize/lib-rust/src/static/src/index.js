// Stub enough of process to make browserify's util happy...
process = { env: {} }

let chai = require('chai')
format = require('util').format;
assert = chai.assert;
expect = chai.expect;
should = chai.should;

// let logs = []
// appendLog = (type, message, ...optionalParams) => {
//     // logs.push(`${(new Date()).toTimeString()} [${type}]  ${format(message, ...optionalParams)}`)
// }
// clearLog = () => logs = [];

// console = {
//     log: (msg, ...args) => appendLog('log', msg, ...args),
//     info: (msg, ...args) => appendLog('info', msg, ...args),
//     warn: (msg, ...args) => appendLog('warn', msg, ...args),
//     error: (msg, ...args) => appendLog('error', msg, ...args),
//     trace: (msg, ...args) => appendLog('trace', msg, ...args),
//     debug: (msg, ...args) => appendLog('debug', msg, ...args),
// };

// var request = {};
// var response = {};
// var names = [];
// var inIt = false;
// var results = [];

// function pushResult(result) {
//     results.push({
//         ...result,
//         logs: logs.length > 0 ? logs : undefined
//     });
// }

// function describe(name, run) {
//     names.push(name);
//     try {
//         run()
//     } finally {
//         names.pop();
//     }
// }

// function it(behavior, run) {
//     try {
//         if (inIt) {
//             throw new Error('\"it\" cannot be contained in another \"it\" block')
//         }
//         if (names.length === 0) {
//             throw new Error('\"it\" must be contained in a \"describe\" block');
//         }
//         inIt = true;
//         run();
//         pushResult({ testName: [...names, behavior], success: true, logs });
//         clearLog();
//     } catch (e) {
//         pushResult({ testName: [...names, behavior], success: false, error: e.message, logs })
//         clearLog()
//     } finally {
//         inIt = false
//     }
// }

// function runTestSuite(request1, response1, testSuite) {
//     request = request1;
//     response = response1;
//     names = []
//     clearLog()
//     results = []
//     testSuite()
//     return JSON.stringify(results)
// }