'use strict';
var learnjs = {};
learnjs.problemView = function (problemNumber) {
    var title = 'Problem #' + problemNumber + ' Coming soon!';
    return $('<div class="problem-view">').text(title);
}
learnjs.showView = function (hash) {
    /* 自分でいじってみた
    var root = 'http://localhost:9292/'
    var hash_2 = hash.newURL.replace(root, '');
    console.log(hash_2);
    var viewFn = routes[hash_2];
    */
    var routes = {
        '#problem': learnjs.problemView
    }
    var hashParts = hash.split('-');
    var viewFn = routes[hashParts[0]];
    if (viewFn) {
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
}