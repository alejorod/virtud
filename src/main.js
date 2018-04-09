const customTypes = {};

function isCustom(type) {
    return Object.keys(customTypes).indexOf(type) !== -1;
}

function isEventProp(prop) {
    return /^on/.test(prop);
}

function extractEventName(prop) {
    return prop.slice(2).toLowerCase();
  }

function h(type, props, ...children) {
    let expChilds = children.reduce((p, n) => {
        if (Array.isArray(n)) {
            return p.concat(n);
        }
        p.push(n);
        return p;
    }, []);
    if (isCustom(type)) {
        return customTypes[type](type, props, expChilds);
    }
    return { type, props: props || {}, children: expChilds };
}

function diffProps(node1, node2) {
    let props = Object.keys(node1.props).concat(Object.keys(node2.props));
    for (let i = 0; i < props.length; i++) {
        const k = props[i];
        let prop1 = node1.props[k];
        let prop2 = node2.props[k];

        if (typeof prop1 === 'function' && typeof prop2 === 'function') {
            continue;
        }

        if (Array.isArray(prop1) && Array.isArray(prop2)) {
            let len = Math.max(prop1.length, prop2.length);
            for (let i = 0; i < len; i++) {
                if (prop1[i] !== prop2[i]) {
                    return true;
                }
            }
        }

        if (node1.props[k] !== node2.props[k]) {
            return true;
        }
    }
    return false;
}

function setProp($el, prop, value) {
    if (prop === 'className') {
        $el.setAttribute('class', value);
    } else if (typeof value === 'boolean') {
        $el.setAttribute(prop, value);
        $el[prop] = value;
    } else if (isEventProp(prop)) {
        $el.addEventListener(extractEventName(prop), value);
    } else {
        $el.setAttribute(prop, value);
    }
}

function removeProp($el, prop, value) {
    if (prop === 'className') {
        $el.removeAttribute('class');
    } else {
        $el.removeAttribute(prop);
    }
    if (typeof value === 'boolean') {
        $el[prop] = false;
    }
}

function updateProps($el, newNode, oldNode) {
    let newProps = newNode.props;
    let oldProps = (oldNode || {}).props || {};
    let props = Object.keys(newProps).concat(Object.keys(oldProps));

    props.forEach(p => {
        if (!newProps[p] && newProps[p] !== 0) {
            removeProp($el, p, oldProps[p]);
        } else if (!oldProps[p] || (newProps[p] !== oldProps[p] && typeof oldProps[p] !== 'function')) {
            setProp($el, p, newProps[p])
        }
    });
}

function diff(node1, node2) {
    return typeof node1 !== typeof node2 ||
        typeof node1 !== 'object' && node1 !== node2 ||
        node1.type !== node2.type;
}

function create(node) {
    if (typeof node !== 'object') {
        return document.createTextNode(node);
    }

    if (isCustom(node.type)) {
        return create(node.render());
    } else {
        let $el = document.createElement(node.type);
        
        updateProps($el, node);

        return node.children
            .map(create)
            .reduce(($el, e) => {
                $el.appendChild(e);
                return $el;
            }, $el);
    }
}

function update($parent, newNode, oldNode, index=0) {
    if (!oldNode) {
        $parent.appendChild(create(newNode));
        return;
    }
    
    if (!newNode) {
        $parent.removeChild($parent.childNodes[index]);
        return;
    }
    
    if (diff(newNode, oldNode)) {
        $parent.replaceChild(create(newNode), $parent.childNodes[index]);
        return;
    } 
    
    if (newNode.type) {
        if (diffProps(newNode, oldNode)) {
            if (isCustom(newNode.type)) {
                update($parent, newNode.render(), oldNode.render(), index);
                return;
            } else {
                updateProps($parent.childNodes[index], newNode, oldNode);
            }
        }

        const max = Math.max(newNode.children.length, oldNode.children.length);
        for (let i = max - 1; i >= 0; i--) {
            update(
                $parent.childNodes[index],
                newNode.children[i],
                oldNode.children[i], 
                i
            );
        }
    }
}

export function component({name, methods={}, render}) {
    function hc(type, props, children) {
        let ctx = Object.assign({}, props, { children });
        
        Object.keys(methods).forEach(m => {
            methods[m] = methods[m].bind(ctx)
        });

        Object.assign(ctx, methods);

        return {
            type,
            props: props || {},
            children,
            render: render.bind(ctx)
        };
    }

    customTypes[name] = hc;
}

export function tree({data, methods={}, render}) {
    let ctx = {};
    Object.keys(data).forEach(attr => {
        data[`_$${attr}`] = data[attr];
        Object.defineProperty(data, attr, {
            get: () => {
                return data[`_$${attr}`];
            },
            set: (val) => {
                data[`_$${attr}`] = val;
                ctx.update();
            }
        });
        
        Object.defineProperty(ctx, attr, {
            get: () => {
                return data[attr]
            },
            set: (val) => {
                data[attr] = val;
            }
        });
    });

    function tupdate() {
        let t = this.render();
        update(this.$el, t, this.currentNode);
        this.currentNode = t;
    }

    function tmount(el) {
        this.$el = document.getElementById(el);
        this.currentNode = this.render();
        update(this.$el, this.currentNode);
    }

    ctx.render = render.bind(ctx);
    ctx.mount  = tmount.bind(ctx);
    ctx.update = tupdate.bind(ctx);

    Object.keys(methods).forEach(m => {
        methods[m] = methods[m].bind(ctx);
    });

    Object.assign(ctx, methods);

    return ctx;
}

export const core = {
    h,
    create,
    update
};

export default {
    component,
    tree,
    core
};