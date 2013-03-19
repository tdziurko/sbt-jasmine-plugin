var TeamCityReporter = function() {
    /*
     * Reporter which reports results of the tests to TeamCity
     */

    var tidy = function tidy(text) {
        var cleanedText = text
            .replace(/\|/g, "||")
            .replace(/'/g, "|'")
            .replace(/\n/g, "|n")
            .replace(/\r/g, "|r")
            .replace(/\u0085/g, "|x")
            .replace(/\u2028/g, "|l")
            .replace(/\u2029/g, "|p")
            .replace(/\[/g, "|[")
            .replace(/\]/g, "|]");

        return cleanedText;
    }

    return {
        reportRunnerStarting: function(runner) {
            EnvJasmine.teamCityReports.push("##teamcity[testSuiteStarted name='Jasmine Tests']");
        },

        reportRunnerResults: function(runner) {
            EnvJasmine.teamCityReports.push("##teamcity[testSuiteFinished name='Jasmine Tests']");
        },

        reportSuiteResults: function(suite) {  },

        reportSpecStarting: function(spec) {  },
        reportSpecResults: function(spec) {
            var lastIndexOfSeparator = EnvJasmine.specFile.lastIndexOf(EnvJasmine.SEPARATOR)
            var fileName = EnvJasmine.specFile.substring(lastIndexOfSeparator + EnvJasmine.SEPARATOR.length);
            var suiteName = this.getSuiteName(spec.suite);
            var testName = tidy(fileName + ", " + suiteName + ":" + spec.description);

            EnvJasmine.teamCityReports.push("##teamcity[testStarted name='" + testName + "']");

            if (spec.results().passed()) {
                System.out.print(EnvJasmine.green("."));
                EnvJasmine.teamCityReports.push("##teamcity[testPassed " + "name='" + testName + "']");
            } else {
                var i, result, specResults = spec.results().getItems();
                var message = "";
                var messageDelimeter = "";
                var details = "";
                var detailsDelimeter = "";

                for (i = 0; i < specResults.length; i++) {
                    result = specResults[i];
                    if (result.type == 'log') {
                        message = message + messageDelimeter + result.toString();
                        messageDelimeter = "; ";
                    } else if (result.type == 'expect' && result.passed && !result.passed()) {
                        message = message + messageDelimeter + result.toString();
                        messageDelimeter = ", ";
                        if (result.trace.stack) {
                            details = details + detailsDelimeter + specResults[i].trace.stack;
                            detailsDelimeter = "; ";
                        }
                    }
                }

                EnvJasmine.teamCityReports.push("##teamcity[testFailed " + "name='" + tidy(testName) +
                    "' message='" + tidy(message) +"' details='" + tidy(details) + "']");
            }
            EnvJasmine.teamCityReports.push("##teamcity[testFinished name='" + testName + "']");
        },

        log: function(str) {    },

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