var router = new VueRouter({
    routes: [
        {
            path: '/',
            component: {
                template: '<div>Top Page</div>'
            }
        },
        {
            path: '/problems/:problemId',
            component: {
                template: '<div>Problem {{ $route.params.problemId}}</div>'
            }
        }
    ]
})

var app = new Vue({
    el: '#markup',
    data: {
        problems: [
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
        ],
    },
    router:router,
})

Vue.component('problem-view', {
    template: ''
})