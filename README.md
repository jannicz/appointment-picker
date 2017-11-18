A lightweight, accessible and customizable javascript timepicker. Accessibility is based on ARIA states and keyboard support. The styling is kept simple and can be easily changed or themed.

# Advantages
 - no dependencies
 - tiny (<6KB minified, <2KB gzipped)
 - may be used with or without jQuery
 - styling is easy to change

# Usage
Import both the stylesheet and the script
```html
<link rel="stylesheet" href="css/appointment-picker.css">
<script src="js/appointment-picker.js"></script>
```

## Use as jQuery plugin

If you would like to use the appointment-picker as a jQuery plugin 
```javascript
// To use appointmentPicker as jQuery plugin
$.fn.appointmentPicker = function(options) {
  this.appointmentPicker = new AppointmentPicker(this[0], options);
  return this;
};
```

Now you can initialize the picker on any text input field
```html
<input id="time-1" type="text">
```
```javascript
var $picker = $('#time-1').appointmentPicker();
```

## Use without any dependency
If you don't want any dependency, you can initialize the picker just like that
```html
<input id="time-2" type="text" value="10:00">
```
```javascript
var picker = new AppointmentPicker(document.getElementById('time-2'), {});
```

# Options

# Methods
To get the current time programatically from a picker instance use
```javascript
// without jQuery
picker.getTime();
// or access the picker instance of the jQuery object
$picker.appointmentPicker..getTime();
```

To destroy the picker instance and remove both the markup and all event listeners
```javascript
// without jQuery
picker.destroy();
// or with the use of jQuery
$picker.appointmentPicker.destroy();
```

# Styling

# Best practices
- Appointment-Picker neither installs event listeners outside the input nor renders any markup untill it is opened by the user.
- It can be destroyed using its own method that causes all event listeners and markup to be removed (if used for a single page application)

# AMD / CommonJS wrapper
Appointment-Picker supports AMD and CommonJS import
```javascript
if (typeof exports === 'object') {
  module.exports = factory(root);
} else if (typeof define === 'function' && define.amd) {
  define('appointment-picker', [], function () {
    return factory(root);
  });
} else {
  root.AppointmentPicker = factory(root);
}
```
# Datepair Plugin Example

You can combine this timepicker plugin with PikaDay to have a date time pair example:

Link to Pikaday: https://github.com/dbushell/Pikaday
