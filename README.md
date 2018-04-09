# VIRTUD

Proof of concept for view layer mixing parts of react and vue. Not meant for production, more of personal use/learning expirience.

Uses a simple/naive virtual dom implementation and reactive system.

### Installation

#### With npm:
```
npm install --save virtud
```

### Usage
````jsx
import virtud from 'virtud';

const app = virtud.tree({
    data: {
        message: 'hello world!'
    },
    methods: {
        updateMessage: function(e) {
            this.message = e.target.value;
        }
    },
    render: function() {
        return (
            <div>
                <h2>{this.message}</h2>
                <input value={this.message} onInput={this.updateMessage}/>
            </div>
        );
    }
});

// mount the app to an HTML element with id "app"
app.mount('app');

// read data from the app instance
console.log(app.message); // => 'hello world!'

// update data from the app instace 
app.message = 'hello there!'; // html view will be updated


// Using components

// add a custom component globaly
// works like react stateless components but 
// access passed in data through `this` keyword
virtud.component({
    name: 'prettyinput',
    render: function() {
        return (
            <div>
                <label>{this.label}</label>
                <input value={this.value} onInput={this.handleUpdate}/>
            </div>
        );
    }
});

// uses custom component like other html tag by the registered name
const app2 = virtud.tree({
    data: {
        message: 'hello world!'
    },
    methods: {
        updateMessage: function(e) {
            this.message = e.target.value;
        }
    },
    render: function() {
        return (
            <div>
                <h2>{this.message}</h2>
                <prettyinput 
                    label="type your message"
                    value={this.message} 
                    handleUpdate={this.updateMessage} />
            </div>
        );
    }
});

app2.mount('app2');

````

### API

### virtud.tree

```
virtud.tree({data, methods, render}) : Object
```

Creates a reactive app based on data and template information 


|Parameters|
| :--- |
| **data : {Object}** |
| data to be used as part of the tree context (e.g methods and render `this` context)|
| **methods : {Object}**|
| methods that have access to the `data` as its `this` context, need to be functions, not arrow functions.|
| **render : {Function}**|
| Function with access to both `data` and `methods` as its `this` context, should return valid `jsx` code.|

### virtud.component

```
virtud.component({name, methods, render}) : void
```

Adds a component globaly to the virtud virtual dom system.

|Parameters|
| :--- |
| **name : {String}** |
| Name to be used as its tag in other components or tree.|
| **methods : {Object}**|
| same as `virtud.tree` methods parameter but instead of accesing a data object, it has access to the attributes passed 
to it|
| **render : {Function}**|
| Function with access to both the attributes passed in and `methods` as its `this` context, should return valid `jsx` code.|


> Note:
> *to transpile jsx code use pragma `virtud.core.h`*

* * *

Made with :heart: by [Alejo Rodriguez](https://alejorod.github.io/arodriguez/)
