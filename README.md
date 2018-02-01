Hyperstructify
==============

Hyperstructify is a UI for [structifytextjs](https://www.npmjs.com/package/structifytextjs) in the form of a [Hyper.app](https://hyper.is/) plugin.

Installation
------------

With hpm: :

    hpm install hyperstructify

From npm :

    npm install hyperstructify

From source :

    yarn webpack
    cp dist/hyperstructify.js ~/.hyper_plugins/local/

Ensure `~/.hyper.js` has `"hyperstructify"` in the `plugins` list:

```
plugins: [
  "hyperstructify",
],
```

Usage
-----

To toggle the plugin/modeller either `hyperstructify` from Plugins -> `Toggle Hyperstructify` or press `shift + cmd + M`.

Enter your model in the top Editor. Clicking the "Parse" button will automatically select all the contents in the first terminal and parse it in accordance to the model. The output will be in the bottom Editor.

You can highlight any subsection of the terminal and parse that instead, if you do not want the whole contents of the buffer.

