define('dosome', function () {
    console.log('do some');
});
define('index', ['dosome'], function (dosomne) {
    alert('paypal');
});