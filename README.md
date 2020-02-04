# Bettink App

The Bettink WindUp app.
 
If you have issues with NPM being slow, we recommend installing `yarn` with `npm install yarn -g` and use yarn instead of NPM.

## Build Setup

``` bash
# install dependencies
npm install || yarn
 
# serve with hot reload at localhost:8080 
npm run dev || yarn run dev
 
# build for production with minification 
npm run build || yarn run build
 
# build for production and view the bundle analyzer report 
npm run build --report || yarn run build --report
 
# run on iPhone X or its simulator

cordova platform add ios
npm run build && cordova run ios --target="iPhone-X"
```
Having issues building Android (6.x)?
Make sure that the project has been run with Android Studio at least once and if it still won't run with the regular cordova  commands, run the following command to fix the "span EACCESS" error.
``` bash 
chmod 777 platforms/android/gradlew
```
___
# Style
There are currently no style folders and/or files defined for a specific page or component. Instead, global styles and variables are applied. You can edit these in the style folder.

Each and every page and component have their own style tag in which you define the styles for that page/component.

Try to re-use as much classes / variables as you can by splitting those up into the style files: forms have their own classes and subclasses in the `_forms.scss` file. You can use these to whip up a default look for your form, and customize the forms on every page/component by using that specific style tag.

**NOTE:** Don't forget to "scope" your style tag. If you don't, the style may be applied to different elements with the same class that are not related.
Also don't forget to add the `lang` prefix, otherwise SCSS nesting won't work.
``` bash
<style scoped lang="scss">
</style>
```
___
# Files
All files with which you code and use within your project (images and the like) reside within the `/src/` folder. When you run `npm run build || yarn run build` the generated files are placed into the `/www/` folder ready to be used by Cordova.

## Aliases and how to use files
Since we are using webpack as a compiler, we have access to aliases. These aliases give you an easy shortcut to accessing files. Instead of using the `../../../src/path/to/file` structure, we can now use `@/path/to/file` to access the `/src/` folder for example.

The aliases are used in two different ways:
  
1. **Javascript / HTML**: you can just use it as is. You want to import a library file? Use: `@/lib/path/to/file`. This will automatically search for the appropriate file within `/src/lib/path/to/file`, no matter how many folders down you are.
  
2. **SCSS**: you will have to prepend the given alias with a tilde `~`. Example: `@import "../../../src/path/to/file"` becomes `@import "~@/path/to/file"`

Current aliases used:

```
@ - /src/
 
page - /src/pages/
 
component - /src/components/
 
styles - /src/styles/
```

## Assets (images and the like)
Images are present within the `/src/assets/` folder. You can use whatever folder structure you prefer within the assets folder.
___
# Translations
Translation files are present within the `/src/i18n/` folder. You can add more translations by adding it to the `/src/i18n/index.js` file as a part of the exported object.

For example:

You can add the `en-EN` language by editing the `/src/i18n/index.js` like so:
``` bash
import nl_NL from './languages/nl_NL.js';
import en_EN from './languages/en_EN.js';
  
export default {
    'nl-NL': nl_NL,
    'nl': nl_NL,
    'en-EN': en_EN,
    'en': en_EN
};
```
You have to generate a new `en_EN.js` file in the languages folder ofcourse. You can generate a duplicate of the `nl_NL.js` and then adjust it accordingly.

### Usage
You can use translated strings by simply using the global mixin function: `t("key")`. There are multiple ways to implement this however:
  
1. Usage HTML: `{{ t("key") }}`
  
2. Usage Javascript in a Vue instance with access to the `this` variable: `this.t("key")`. 
  
3. Usage in a library file which has no access to the regular Vue instance requires a bit more work: 
```
import Mixins from 'path/to/mixins';
 
Mixins.t("key");
```

## Generating Splash screens and/or Icons
[http://phonegap.appiq.software](http://phonegap.appiq.software)# windTurbine
