define('head', function () {
    console.log('head11');
});
define('index', ['head'], function (head) {
    alert('app');
});