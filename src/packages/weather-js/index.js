/*
 * Weather
 * For the full copyright and license information, please view the LICENSE.txt file.
 */

/* jslint node: true, sub: true */
"use strict";

var axios = require("axios"),
    qs = require("querystring"),
    xml2JS = require("xml2js");

// Init the module
module.exports = (function () {
    var xmlParser = new xml2JS.Parser({
            charkey: "C$",
            attrkey: "A$",
            explicitArray: true,
        }),
        defLang = "en-US",
        defDegreeType = "F",
        defTimeout = 10000,
        findUrl = "http://weather.service.msn.com/find.aspx";

    var find = function find(options, callback) {
        if (typeof callback !== "function")
            callback = function callback(err, result) {
                return err || result;
            };

        if (!options || typeof options !== "object")
            return callback("invalid options");

        if (!options.search) return callback("missing search input");

        var result = [],
            lang = options.lang || defLang,
            degreeType = options.degreeType || defDegreeType,
            timeout = options.timeout || defTimeout,
            search = qs.escape("" + options.search),
            reqUrl =
                findUrl +
                "?src=outlook&weadegreetype=" +
                ("" + degreeType) +
                "&culture=" +
                ("" + lang) +
                "&weasearchstr=" +
                search;

        axios
            .get(reqUrl, { timeout: timeout })
            .then(function (response) {
                var body = response && response.data;

                if (response.status !== 200)
                    return callback(
                        new Error("request failed (" + response.status + ")"),
                    );
                if (!body)
                    return callback(new Error("failed to get body content"));

                // Check body content
                if (body.indexOf("<") !== 0) {
                    if (body.search(/not found/i) !== -1) {
                        return callback(null, result);
                    }
                    return callback(new Error("invalid body content"));
                }

                // Parse body
                xmlParser.parseString(body, function (err, resultJSON) {
                    if (err) return callback(err);

                    if (
                        !resultJSON ||
                        !resultJSON.weatherdata ||
                        !resultJSON.weatherdata.weather
                    )
                        return callback(
                            new Error("failed to parse weather data"),
                        );

                    if (
                        resultJSON.weatherdata.weather["A$"] &&
                        resultJSON.weatherdata.weather["A$"].errormessage
                    )
                        return callback(
                            resultJSON.weatherdata.weather["A$"].errormessage,
                        );

                    if (!(resultJSON.weatherdata.weather instanceof Array)) {
                        return callback(new Error("missing weather info"));
                    }

                    // Iterate over weather data
                    var weatherLen = resultJSON.weatherdata.weather.length,
                        weatherItem;
                    for (var i = 0; i < weatherLen; i++) {
                        if (
                            typeof resultJSON.weatherdata.weather[i]["A$"] !==
                            "object"
                        )
                            continue;

                        // Init weather item
                        weatherItem = {
                            location: {
                                name: resultJSON.weatherdata.weather[i]["A$"][
                                    "weatherlocationname"
                                ],
                                zipcode:
                                    resultJSON.weatherdata.weather[i]["A$"][
                                        "zipcode"
                                    ],
                                lat: resultJSON.weatherdata.weather[i]["A$"][
                                    "lat"
                                ],
                                long: resultJSON.weatherdata.weather[i]["A$"][
                                    "long"
                                ],
                                timezone:
                                    resultJSON.weatherdata.weather[i]["A$"][
                                        "timezone"
                                    ],
                                alert: resultJSON.weatherdata.weather[i]["A$"][
                                    "alert"
                                ],
                                degreetype:
                                    resultJSON.weatherdata.weather[i]["A$"][
                                        "degreetype"
                                    ],
                                imagerelativeurl:
                                    resultJSON.weatherdata.weather[i]["A$"][
                                        "imagerelativeurl"
                                    ],
                                //url: resultJSON.weatherdata.weather[i]['A$']['url'],
                                //code: resultJSON.weatherdata.weather[i]['A$']['weatherlocationcode'],
                                //entityid: resultJSON.weatherdata.weather[i]['A$']['entityid'],
                                //encodedlocationname: resultJSON.weatherdata.weather[i]['A$']['encodedlocationname']
                            },
                            current: null,
                            forecast: null,
                        };

                        if (
                            resultJSON.weatherdata.weather[i][
                                "current"
                            ] instanceof Array &&
                            resultJSON.weatherdata.weather[i]["current"]
                                .length > 0
                        ) {
                            if (
                                typeof resultJSON.weatherdata.weather[i][
                                    "current"
                                ][0]["A$"] === "object"
                            ) {
                                weatherItem.current =
                                    resultJSON.weatherdata.weather[i][
                                        "current"
                                    ][0]["A$"];

                                weatherItem.current.imageUrl =
                                    weatherItem.location.imagerelativeurl +
                                    "law/" +
                                    weatherItem.current.skycode +
                                    ".gif";
                            }
                        }

                        if (
                            resultJSON.weatherdata.weather[i][
                                "forecast"
                            ] instanceof Array
                        ) {
                            weatherItem.forecast = [];
                            for (
                                var k = 0;
                                k <
                                resultJSON.weatherdata.weather[i]["forecast"]
                                    .length;
                                k++
                            ) {
                                if (
                                    typeof resultJSON.weatherdata.weather[i][
                                        "forecast"
                                    ][k]["A$"] === "object"
                                )
                                    weatherItem.forecast.push(
                                        resultJSON.weatherdata.weather[i][
                                            "forecast"
                                        ][k]["A$"],
                                    );
                            }
                        }

                        // Push weather item into result
                        result.push(weatherItem);
                    }

                    return callback(null, result);
                });
            })
            .catch(function (err) {
                if (err && err.response && err.response.status) {
                    return callback(
                        new Error(
                            "request failed (" + err.response.status + ")",
                        ),
                    );
                }

                return callback(err);
            });
    };

    return {
        find: find,
    };
})();
