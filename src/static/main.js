var container = document.getElementById('container');

var patch = snabbdom.init([
    snabbdom_style,
    snabbdom_class,
    snabbdom_props,
    snabbdom_attributes,
    snabbdom_eventlisteners
]);

var ws = new WebSocket("ws://127.0.0.1:8080/websocket");  // TODO: support https/wss

ws.onopen = function (_) {
    var msg = {
        path: location.pathname,
        type: 'init',
    };
    ws.send(JSON.stringify(msg));
};

/* Translate json to `vnode` using `h` snabbdom helper */
var translate = function(json) {
    var options = {attrs: json.attributes};

    // create callback for each events
    var on = {};
    if(json.on) {
        options.on = {};
        Object.keys(json.on).forEach(function(event_name) {  // TODO: optimize with for-loop
            options.on[event_name] = function(event) {
                var msg = {
                    path: location.pathname,
                    type: 'dom-event',
                    key: json.on[event_name],
                    event: JSON.stringify(event),
                }
                console.log('send', msg);
                ws.send(JSON.stringify(msg));
            }
        });
    }

    // recurse to translate children
    var children = json.children.map(function(child) {  // TODO: optimize with a for-loop
        if (child instanceof Object) {
            return translate(child);
        } else { // it's a string or a number
            return child;
        }
    });

    return h(json.tag, options, children);
}

ws.onmessage = function(msg) {
    console.log('onmessage', msg);
    var msg = JSON.parse(msg.data);
    container = patch(container, translate(msg.html))
}
