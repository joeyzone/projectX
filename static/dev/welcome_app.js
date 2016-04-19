define('alert', [], function () {
    var alertStr = 'this is alert module';
    console.log('alert');
    return alert;
});
define('head', ['alert'], function (test) {
    console.log('head11');
    console.log(test);
});
define('index', ['head'], function (head) {
    alert('app');
});