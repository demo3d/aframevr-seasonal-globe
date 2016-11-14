AFRAME.registerComponent('set-attribute', {
  schema: {
    on: {type: 'string'},
    target: {type: 'selector'},
    attribute: {type: 'string'},
    value: {type: 'string'}
  },

  init: function () {
    var data = this.data;
    var el = this.el;

    el.addEventListener(data.on, _ => {
        console.log(data.attribute + " --> " + data.value)
        data.target.setAttribute("dynamic-globe", data.attribute, data.value);
    });
  }
})
