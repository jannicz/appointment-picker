A lightweight, accessible and customizable javascript timepicker. Accessibility is based on ARIA states and keyboard support. The styling is kept simple and can be easily changed or themed.

# Advantages
 - no dependencies
 - tiny (<6KB minified, <2KB gzipped)
 - may be used with or without jQuery
 - styling is easy to change
 
 <img src="https://github.com/jannicz/appointment-picker/blob/develop/example/appointment-picker.png" width="240" />

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
Appointment-Picker can be configured with options
- `interval` sets the interval between appointments in minutes (1-60), if this number gets high the picker will get a scrollbar, default is `60`
- `mode` the picker can be used in standard `24h` hour mode or in `12h` mode - the latter uses am/pm postfix
- `minTime` sets the minimum hour that can be picked, default is `0` what is eqivalent to 12am
- `maxTime` sets the maximum hour that can be picked, default is `24`
- `startTime` hides all appointments below this hour, default is `0`
- `endTime` hides all appointments above this hour, default is `24`
- `large` increasesthe size of the picker and the appointments by setting a `is-large` modifier
- `title` defines the picker's heading

__Note:__ with startTime and endTime appointment hours can be visually removed. If startTime is greater then minTime a lower time can still be manually set via the keyboard. On the other hand the picker does not accept times lower then minTime and higher then maxTime.

Pass the options into the the AppointmentPicker call or the jQuery plugin call
```javascript
var picker = new AppointmentPicker(document.getElementById('time-2'), {
  interval: 30,
  mode: '12h',
  minTime: 09,
  maxTime: 22,
  startTime: 08,
  endTime: 24,
  large: true
});

// With jQuery
$('#time-1').appointmentPicker({
  interval: 15
});
```

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
