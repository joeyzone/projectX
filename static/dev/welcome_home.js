define('mod1', function () {
    console.log('ths is mod1 code');
    return { str: 'this is relate mod1' };
});
define('alert', [], function () {
    var alertStr = 'this is alert module';
    console.log('alert');
    return alert;
});
define('head', ['alert'], function (test) {
    console.log('head11');
    console.log(test);
});
define('index', [
    'mod1',
    'head'
], function (mod1, head) {
    alert(mod1.str);
});