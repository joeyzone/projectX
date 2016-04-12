define('mod1', function () {
    console.log('ths is mod1');
});
define('head', function () {
    console.log('head11');
});
define('index', [
    'mod1',
    'head'
], function (mod1, head) {
    alert(mod1.str);
});