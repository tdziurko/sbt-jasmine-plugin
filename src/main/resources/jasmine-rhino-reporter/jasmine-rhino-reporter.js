importPackage(java.lang);

var RhinoReporter = function() {
	/*
	 * Reporter which reports the number of //expects// checks which
	 * passed/failed at the end of the test run 
	 */

    /**
     * ReplaceAll by Fagner Brack (MIT Licensed)
     * Replaces all occurrences of a substring in a string
     */
    String.prototype.replaceAll = function( token, newToken, ignoreCase ) {
        var _token;
        var str = this + "";
        var i = -1;

        if ( typeof token === "string" ) {

            if ( ignoreCase ) {

                _token = token.toLowerCase();

                while( (
                    i = str.toLowerCase().indexOf(
                        token, i >= 0 ? i + newToken.length : 0
                    ) ) !== -1
                    ) {
                    str = str.substring( 0, i ) +
                        newToken +
                        str.substring( i + token.length );
                }

            } else {
                return this.split( token ).join( newToken );
            }

        }
        return str;
    };

    var tidy = function tidy(text) {

        var cleanedText = text.replaceAll("|", "||")
            .replaceAll("'", "|'")
            .replaceAll("\n", "|n")
            .replaceAll("\r", "|r")
            .replaceAll("\u0085", "|x")
            .replaceAll("\u2028", "|l")
            .replaceAll("\u2029", "|p")
            .replaceAll("[", "|[")
            .replaceAll("]", "|]")

        return cleanedText;
    }


    return {
        reportRunnerStarting: function(runner) {
            if (EnvJasmine.incrementalOutput) {
                print(EnvJasmine.specFile);
            }
        },

        reportRunnerResults: function(runner) {
            var results = runner.results();

            if (EnvJasmine.incrementalOutput) {
                var passed = results.passedCount - EnvJasmine.passedCount,
                    failed = results.failedCount - EnvJasmine.failedCount,
                    total = results.totalCount - EnvJasmine.totalCount;
                print();
                print([
                    EnvJasmine[passed ? 'green' : 'plain']("Passed: " + passed),
                    EnvJasmine[failed ? 'red' : 'plain']("Failed: " + failed),
                    EnvJasmine.plain("Total: " + total)
                ].join(' '));
            }

            EnvJasmine.passedCount = results.passedCount;
            EnvJasmine.failedCount = results.failedCount;
            EnvJasmine.totalCount = results.totalCount;
        },

        reportSuiteResults: function(suite) {
        },

        reportSpecStarting: function(spec) {
        },

        reportSpecResults: function(spec) {
            var suiteName = this.getSuiteName(spec.suite);
            var testName = tidy(suiteName + ":" + spec.description);

            EnvJasmine.teamCityReports.push("##teamcity[testStarted name='" + testName + "']");

            if (spec.results().passed()) {
                System.out.print(EnvJasmine.green("."));
                EnvJasmine.teamCityReports.push("##teamcity[testPassed " + "name='" + testName + "']");
            } else {
                var i, msg, result,
                    specResults = spec.results().getItems();
                var message = "";
                var details = "";

                System.out.print(EnvJasmine.red("F"));

                msg = [
                    "FAILED",
                    "File : " + EnvJasmine.specFile,
                    "Suite: " + this.getSuiteName(spec.suite),
                    "Spec : " + spec.description
                ];

                for (i = 0; i < specResults.length; i++) {
                    result = specResults[i];
                    if (result.type == 'log') {
                        msg.push(result.toString());
                        message = result.toString();
                    } else if (result.type == 'expect' && result.passed && !result.passed()) {
                        msg.push(result.message);
                        message = result.toString();
                        if (result.trace.stack) {
                            msg.push(specResults[i].trace.stack);
                            details = specResults[i].trace.stack;
                        }
                    }
                }

                EnvJasmine.teamCityReports.push("##teamcity[testFailed " + "name='" + tidy(testName) +
                    "' message='" + tidy(message) +"' details='" + tidy("test details") + "']");
//                EnvJasmine.teamCityReports.push("##teamcity[testFailed name='tomek test' message='failure message' details='message and stack trace']");
//                EnvJasmine.teamCityReports.push("##teamcity[testFailed " + "name='" + tidy(testName) + "']");
                EnvJasmine.results.push(msg.join("\n"));
            }
            EnvJasmine.teamCityReports.push("##teamcity[testFinished name='" + testName + "']");
        },

        log: function(str) {
        },

        getSuiteName: function(suite) {
            var suitePath = [];

            while (suite) {
                suitePath.unshift(suite.description);
                suite = suite.parentSuite;
            }

            return suitePath.join(' - ');
        }
    };
};

var RhinoSpecReporter = function() {
	/*
	 * Reporter which reports the number of //specs// which passed/failed at the end
	 * of the test run 
	 */



    return {
        reportRunnerStarting: function(runner) {
            if (EnvJasmine.incrementalOutput) {
                print(EnvJasmine.specFile);
            }
        },

        reportRunnerResults: function(runner) {
            var results = runner.results();

            if (EnvJasmine.incrementalOutput) {
                print();
                print([
                    EnvJasmine.green("Passed: " + (results.passedCount - EnvJasmine.passedCount)),
                    EnvJasmine.red("Failed: " + (results.failedCount - EnvJasmine.failedCount)),
                    EnvJasmine.plain("Total: " + (results.totalCount - EnvJasmine.totalCount))
                ].join(' '));
            }
        },

        reportSuiteResults: function(suite) {
        },

        reportSpecStarting: function(spec) {
        },

        reportSpecResults: function(spec) {

            if (spec.results().passed()) {
                System.out.print(EnvJasmine.green("."));
                EnvJasmine.passedCount += 1;
            } else {
                var i, msg, result,
                    specResults = spec.results().getItems();

                System.out.print(EnvJasmine.red("F"));

                msg = [
                    "FAILED",
                    "File : " + EnvJasmine.specFile,
                    "Suite: " + this.getSuiteName(spec.suite),
                    "Spec : " + spec.description
                ];

                for (i = 0; i < specResults.length; i++) {
                    result = specResults[i];
                    if (result.type == 'log') {
                        msg.push(result.toString());
                    } else if (result.type == 'expect' && result.passed && !result.passed()) {
                        msg.push(result.message);

                        if (result.trace.stack) {
                            msg.push(specResults[i].trace.stack);
                        }
                    }
                }
                EnvJasmine.failedCount += 1;
                EnvJasmine.results.push(msg.join("\n"));

            }
            EnvJasmine.totalCount += 1;
        },

        log: function(str) {
        },

        getSuiteName: function(suite) {
            var suitePath = [];

            while (suite) {
                suitePath.unshift(suite.description);
                suite = suite.parentSuite;
            }

            return suitePath.join(' - ');
        }
    };
};


