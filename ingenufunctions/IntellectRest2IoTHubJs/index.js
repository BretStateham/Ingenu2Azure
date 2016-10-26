module.exports = function (context, timerTrigger) {
    
    var timeStamp = new Date().toISOString();
    
    if(timerTrigger.isPastDue)
    {
        context.log('Node.js is running late!');
    }
    context.log('Saying Hi: ' + sayHi());
    context.log('Node.js timer trigger function ran!', timeStamp);   
    
    context.done();
};

var sayHi = function(){
    return "Hi";
}