var TeamCityReporter = function() {
    /*
     * Reporter which reports results of the tests to TeamCity
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
            print("##teamcity[testSuiteStarted name='Jasmine Tests']");
        },

        reportRunnerResults: function(runner) {
            print("##teamcity[testSuiteFinished name='Jasmine Tests']");
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