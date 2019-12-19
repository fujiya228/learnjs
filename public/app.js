'use strict';
var learnjs = {
    poolId: 'ap-northeast-1:b0da0264-c4b2-47e3-8ecd-0a3046fd2a2e'
};
//source[learnjs/public/app.js]{
learnjs.problems = [
    {
        description: "What is truth?",
        code: "function problem() { return __; }"
    },
    {
        description: "Simple Math",
        code: "function problem() { return 42 === 6 * __; }"
    },
    {
        description: "Simple Math2",
        code: "function problem() { return 42 === 6 * __; }"
    },
    {
        description: "Simple Math3",
        code: "function problem() { return 42 === 6 * __; }"
    }
];
//}
learnjs.identity = new $.Deferred();
learnjs.sendDbRequest = function (req, retry) {
    var promise = new $.Deferred();
    req.on('error', function (error) {
        if (error.code === "CredentialsError") {
            learnjs.identity.then(function (identity) {
                return identity.refresh().then(function () {
                    return retry();
                }, function () {
                    promise.reject(resp);
                });
            });
        } else {
            promise.reject(error);
        }
    });
    req.on('success', function (resp) {
        promise.resolve(resp.data);
    });
    req.send();
    return promise;
}
learnjs.fetchAnswer = function (problemId) {
    return learnjs.identity.then(function (identity) {
        var db = new AWS.DynamoDB.DocumentClient();
        var item = {
            TableName: 'learnjs',
            Key: {
                userId: identity.id,
                problemId: problemId
            }
        }
        return learnjs.sendDbRequest(db.get(item), function () {
            return learnjs.fetchAnswer(problemId);
        });
    });
}
learnjs.saveAnswer = function (problemId, answer) {
    return learnjs.identity.then(function (identity) {
        var db = new AWS.DynamoDB.DocumentClient();
        var item = {
            TableName: 'learnjs',
            Item: {
                userId: identity.id,
                problemId: problemId,
                answer: answer
            }
        };
        return learnjs.sendDbRequest(db.put(item), function () {
            return learnjs.saveAnswer(problemId, answer);
        });
    });
}
learnjs.problemView = function (data) {
    var problemNumber = parseInt(data, 10);
    var view = $('.templates .problem-view').clone();
    var problemData = learnjs.problems[problemNumber - 1];
    var resultFlash = view.find('.result');
    var answer = view.find('.answer');

    function checkAnswer() {
        var def = $.Deferred();
        var test = problemData.code.replace('__', answer.val()) + '; problem();';
        var worker = new Worker('worker.js');
        worker.onmessage = function (e) {
            if (e.data) {
                def.resolve(e.data);
            } else {
                def.reject();
            }
        }
        worker.postMessage(test);
        return def;
    }

    function checkAnswerClick() {
        checkAnswer().done(function () {
            var flashContent = learnjs.buildCorrectFlash(problemNumber);
            learnjs.flashElement(resultFlash,flashContent);
            learnjs.saveAnswer(problemNumber, answer.val());
        }).fail(function () {
            learnjs.flashElement(resultFlash, 'Incorrect!');
        })
        return false;
    }
    view.find('.check-btn').click(checkAnswerClick);
    view.find('.title').text('Problem #' + problemNumber);
    learnjs.applyObject(problemData, view);

    if (problemNumber < learnjs.problems.length) {
        var buttonItem = learnjs.template('skip-btn');
        // console.log(buttonItem);
        buttonItem.find('a').attr('href', '#problem-' + (problemNumber + 1));
        $('.nav-list').append(buttonItem);
        view.bind('removingView', function () {
            buttonItem.remove();
        });
    }
    learnjs.fetchAnswer(problemNumber).then(function (data) {
        if (data.Item) {
            answer.val(data.Item.answer);
        }
    });
    return view;
}
learnjs.showView = function (hash) {
    /* 自分でいじってみた
    var root = 'http://localhost:9292/'
    var hash_2 = hash.newURL.replace(root, '');
    console.log(hash_2);
    var viewFn = routes[hash_2];
    */
    var routes = {
        '#problem': learnjs.problemView,
        '#profile': learnjs.profileView,
        '#' : learnjs.landingView,
        '' : learnjs.landingView
    }
    var hashParts = hash.split('-');
    var viewFn = routes[hashParts[0]];
    if (viewFn) {
        learnjs.triggerEvent('removingView', []);
        $('.view-container').empty().append(viewFn(hashParts[1]));
        //console.log('viewFn done!')
    }
}
//window.onhashchange = learnjs.showView;
learnjs.appOnReady = function () {
    window.onhashchange = function () {
        learnjs.showView(window.location.hash);
    };
    learnjs.showView(window.location.hash);
    //console.log(learnjs.identity);
    learnjs.identity.done(learnjs.addProfileLink);
}
//問題の中身を全部出力　データ名で判断
learnjs.applyObject = function (obj, elem) {
    for (var key in obj) {
        elem.find('[data-name="' + key + '"]').text(obj[key]);
    }
}
learnjs.flashElement = function (elem, content) {
    elem.fadeOut('fast', function () {
        elem.html(content);
        elem.fadeIn();
    })
}
learnjs.template = function (name) {
    return $('.templates .' + name).clone();
}
learnjs.buildCorrectFlash = function (problemNum) {
    var correctFlash = learnjs.template('correct-flash');
    var link = correctFlash.find('a');
    // console.log(problemNum + ':' + learnjs.problems.length);
    if (problemNum < learnjs.problems.length) {
        link.attr('href', '#problem-' + (problemNum + 1));
    } else {
        link.attr('href', '');
        link.text("You're Finished!");
    }
    return correctFlash;
}
learnjs.landingView = function () {
    return learnjs.template('landing-view');
}
learnjs.triggerEvent = function (name, args) {
    $('.view-container>*').trigger(name, args);
}
learnjs.awsRefresh = function () {
    var deferred = new $.Deferred();
    AWS.config.credentials.refresh(function (err) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(AWS.config.credentials.identityId);
        }
    });
    return deferred.promise();
}
learnjs.profileView = function () {
    var view = learnjs.template('profile-view');
    learnjs.identity.done(function (identity) {
        view.find('.email').text(identity.email);
    });
    return view;
}
learnjs.addProfileLink = function (profile) {
    var link = learnjs.template('profile-link');
    link.find('a').text(profile.email);
    $('.signin-bar').prepend(link);
    console.log('addProfileLink');
}
learnjs.countAnswer = function (problemId) {
    return learnjs.identity.then(function (identity) {
        var db = new AWS.DynamoDB.DocumentClient();
        var params = {
            TableName: 'learnjs',
            Select: 'COUNT',
            FilterExpression: 'problemId = :problemId',
            ExpressionAtributeValues: { ':problemId': problemId }
        };
        return learnjs.sendDbRequest(db.scan(params), function () {
            return learnjs.countAnswer(problemId);
        });
    });
}
learnjs.popularAnswers = function (problemId) {
    return learnjs.identity.then(function () {
        var lambda = new AWS.Lambda();
        var params = {
            FunctionName: 'learnjs_popularAnswers',
            Payload: JSON.stringify({ problemNumber: problemId })
        };
        return learnjs.sendAwsRequest(lambda.invoke(params), function () {
            return learnjs.popularAnswers(problemId);
        });
    });
}
function googleSignIn(googleUser) {
    console.log('googleSignIn');
    console.log(arguments);
    var id_token = googleUser.getAuthResponse().id_token;
    //console.log(id_token);
    AWS.config.update({
        region: 'ap-northeast-1',//< region of identity pool >
        credentials: new AWS.CognitoIdentityCredentials({
            IdentityPoolId: learnjs.poolId,
            Logins: {
                'accounts.google.com': id_token
            }
        })
    })
    function refresh() {
        return gapi.auth2.getAuthInstance().signIn({
            prompt: 'login'
        }).then(function (userUpdate) {
            var creds = AWS.config.credentials;
            var newToken = userUpdate.getAuthResponse().id_token;
            creds.params.Logins['accounts.google.com'] = newToken;
            return learnjs.awsRefresh();
        })
    }
    learnjs.awsRefresh().then(function (id) {
        learnjs.identity.resolve({
            id: id,
            email: googleUser.getBasicProfile().getEmail(),
            refresh: refresh
        });
    })
}
