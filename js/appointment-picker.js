/**
 * Appointment-Picker
 *
 * @module Appointment-Picker
 * @version 0.3.0
 *
 * @author Jan Suwart
*/
(function (root, factory) {
	if (typeof exports === 'object') {
		module.exports = factory(root);
	} else if (typeof define === 'function' && define.amd) {
		define('appointment-picker', [], function () {
			return factory(root);
		});
	} else {
		root.AppointmentPicker = factory(root);
	}
}(this, function(window) {
	'use strict';

	/**
	 * Constructor
	 * @param {DOMnode} el - reference to the time input field
	 * @param {Object} options - user defined options
	 */
	var AppointmentPicker = function(el, options) {
		this.options = {
			interval: 60, // Appointment intervall in minutes
			minTime: 0, // min pickable hour (1-24)
			maxTime: 24, // max pickable hour (1-24)
			startTime: 0, // min displayed hour (1-24)
			endTime: 24, // max displayed hour (1-24)
			mode: '24h', // Whether to use 24h or 12h system
			large: false, // Whether large button style
			title: 'Pick a time'
		};
		this.template = {
			inner: '<li class="appo-picker-list-item">' +
				'<input type="button" tabindex="-1" value="{{time}}" {{disabled}}></li>',
			outer: '<span class="appo-picker-title">{{title}}</span>' +
				'<ul class="appo-picker-list">{{innerHtml}}</ul>',
			time12: 'H:M apm',
			time24: 'H:M'
		};

		this.el = el;
		this.picker = null;
		this.isOpen = false;
		this.isInDom = false;
		this.time = []; // ['18', '30']
		this.intervals = []; // [0, 15, 30, 45]
		this.displayTime = ''; // '6:30pm'
		this.selectionEventFn = this.select.bind(this);
		this.changeEventFn = this.onchange.bind(this);
		this.closeEventFn = this.close.bind(this);
		this.openEventFn = this.open.bind(this);
		this.keyEventFn = this.onKeyPress.bind(this);
		this.tabKeyUpEventFn = this.onTabKeyUp.bind(this);

		initialize(this, el, options || {});
	};

	/**
	 * Initialize the picker, merge default options and check for errors
	 * @param {Object} _this - this view reference
	 * @param {DOMnode} el - reference to the time input field
	 * @param {Object} options - user defined options
	 */
	function initialize(_this, el, options) {
		for (var opt in options) {
			_this.options[opt] = options[opt];
		}

		if (!_this.el) return;
		if (_this.el.length !== undefined) {
			console.warn('appointment-picker: pass only one dom element as argument');
			return;
		} else if (_this.options.interval > 60) {
			console.warn('appointment-picker: the maximal interval is 60');
			return;
		}
		// Create array holding all minute permutations
		for (var j = 0; j < 60 / _this.options.interval; j++) {
			_this.intervals[j] = j * _this.options.interval;
		}

		_this.setTime(_this.el.value);

		el.addEventListener('focus', _this.openEventFn);
		el.addEventListener('keyup', _this.keyEventFn);
		el.addEventListener('change', _this.changeEventFn);
		el.addEventListener('keydown', _this.tabKeyUpEventFn);
	}

	// Attach visibility classes and set the picker's position
	AppointmentPicker.prototype.render = function() {
		if (this.isOpen) {
			var bottom = this.el.offsetTop + this.el.offsetHeight;
			var left = this.el.offsetLeft;
			var oldSelectedEl = this.picker.querySelector('input.is-selected');

			this.picker.classList.add('is-open');
			this.el.setAttribute('aria-expanded', true);

			if (oldSelectedEl) {
				oldSelectedEl.classList.remove('is-selected');
			}
			if (this.time.length) {
				var selectedEl = this.picker.querySelector('[value="' + this.displayTime + '"]');
				
				if (selectedEl) {
					selectedEl.classList.add('is-selected');
				}
			}

			this.picker.style.top = bottom + 'px';
			this.picker.style.left = left + 'px';
		} else {
			this.picker.classList.remove('is-open');
			this.el.setAttribute('aria-expanded', false);
		}
	}

	/**
	 * Opens the picker, registers further click events
	 * @param {Event} e - some event
	 */
	AppointmentPicker.prototype.open = function(e) {
		if (this.isOpen) return;
		if (!this.isInDom) {
			this.picker = this.build();
			this.isInDom = true;
		}
		this.isOpen = true;
		this.render();
		
		this.picker.addEventListener('click', this.selectionEventFn);
		this.picker.addEventListener('keyup', this.keyEventFn);

		var _this = this;
		// Delay document click listener to prevent picker flashing
		setTimeout(function() {	
			document.addEventListener('click', _this.closeEventFn);
		}, 100);
	}

	/**
	 * Close the picker and unregister attached events
	 * @param {Event|null} e - i.e. mouse click event
	 */
	AppointmentPicker.prototype.close = function(e) {
		if (!this.isOpen) return;

		if (e) {
			var el = e.target;
			// Check if the clicked target is inside the picker
			while (el) {
				if (el.matches('.appo-picker')) {
					return;
				} else {
					el = el.parentElement;
				}
			}
		}

		// The target was outside or didn't exist, close picker
		this.isOpen = false;
		this.render();

		this.picker.removeEventListener('click', this.selectionEventFn);
		this.picker.removeEventListener('keyup', this.keyEventFn);
		document.removeEventListener('click', this.closeEventFn);
	}

	/**
	 * Listener for an appointment selection
	 * @param {Event} e - mouse click or keyboard event
	 */
	AppointmentPicker.prototype.select = function(e) {
		var _this = this;
		if (!e.target.value) return;

		this.setTime(e.target.value);
		this.el.focus();
		setTimeout(_this.close(), 100);
	}

	// Handles manual input changes on input field
	AppointmentPicker.prototype.onchange = function(e) {
		this.setTime(this.el.value);
	}

	/**
	 * Move focus forward and backward on keyboard arrow key, close picker on ESC
	 * @param {Event} e - keyboard event
	 */
	AppointmentPicker.prototype.onKeyPress = function(e) {
		var first = this.picker.querySelector('input[type="button"]');
		var selected = this.picker.querySelector('input:focus') ||
			this.picker.querySelector('input.is-selected');
		var next = null;

		switch (e.keyCode) {
			case 27:
				this.close();
				break;
			case 37:
			case 38:
				next = selected ? selected.parentNode.previousElementSibling : first.parentNode;
				break;
			case 39:
			case 40:
				next = selected ? selected.parentNode.nextElementSibling : first.parentNode;
				break;
			default:
		}

		if (next) next.firstChild.focus();
	}

	// Close the picker on a TAB key event
	AppointmentPicker.prototype.onTabKeyUp = function(e) {
		if (e.keyCode === 9) this.close(e);
	}

	// Create a dom node containing the markup for the picker
	AppointmentPicker.prototype.build = function() {
		var node = document.createElement('div');
		node.innerHTML = _assemblePicker(this.options, this.template, this.intervals);
		node.className = ('appo-picker' + (this.options.large ? ' is-large' : ''));
		this.el.insertAdjacentElement('afterend', node);
		return node;
	}

	// Remove the picker's node from the dom and unregister all events
	AppointmentPicker.prototype.destroy = function() {
		console.log('destroy the picker', this.picker);
		this.close(null);

		if (this.picker) {
			this.picker.parentNode.removeChild(this.picker);
			this.picker = null;
		}
		this.el.removeEventListener('focus', this.openEventFn);
		this.el.removeEventListener('keyup', this.tabkeyEventFn);
	}

	/**
	 * Sets the pickers current time variable after validating for min/max
	 * @param {String} value - time input string, i.e. '12:15pm'
	 */
	AppointmentPicker.prototype.setTime = function(value) {
		var time = _parseTime(value);
		var hour = time[0];
		var minute = Number(time[1]);
		var is24h = this.options.mode === '24h';
		var timePattern = is24h ? this.template.time24 : this.template.time12;
		
		//console.log('time to set', time, 'hour', hour, 'is24h', is24h);

		if (!time.length) {
			console.log('wrong format');
		} else if (hour < this.options.minTime || hour > this.options.maxTime) {
			console.log('hour out of min/max', hour, this.options.minTime, this.options.maxTime);
		} else if (hour > 24) {
			console.log('wrong format', hour);
		} else if (this.intervals.indexOf(minute) < 0) {
			console.log('minutes not matching interval', minute);
		} else {
			this.time = time;
		}

		/*
		// If input time does not pass the min/max limits, it will not be applied
		if (time.length && hour < 24 && this.intervals.indexOf(minute) >= 0 &&
			(hour > this.options.minTime || hour < this.options.maxTime)) {
			this.time = time;
		}
		*/

		// Set the time both as currentTime and as input value
		if (this.time.length) {
			this.displayTime = _printTime(this.time[0], this.time[1], timePattern, !is24h);
			this.el.value = this.displayTime;
		}
	}

	// Time getter returns time as 24h
	AppointmentPicker.prototype.getTime = function() {
		return this.time;
	}

	/**
	 * Add a leading zero and convert to string
	 * @param {Number} number - number that needs to be padded
	 * @returns {String} i.e. '05'
	 */
	function _zeroPadTime(number) {
		if (/^[0-9]{1}$/.test(number))
			return '0' + number;
		return number;
	}

	/**
	 * @param {String} time - string that needs to be parsed, i.e. '11:15PM '
	 * @returns {Array} containing [hour, minute]
	 * @see https://regexr.com/3h7bo  
	 */
	function _parseTime(time) {
		var match = time.match(/^([\d]{1,2}):([\d]{2})[\s]*([ap][m])?.*$/);
		var hour;

		if (match) {
			console.log('parse time, match =>', match);

			if (match[3] === 'pm' && match[1] !== '12') {
				hour = Number(match[1]) + 12;
			} else if (match[3] === 'am' && match[1] === '12') {
				hour = 0;
			} else {
				hour = match[1]
			}
			return [hour.toString() , match[2]];
		}
		return [];
	}

	/**
	 * Create time considering am/pm conventions
	 * @param {String} hour 
	 * @param {String} minute
	 * @param {String} pattern - used time format
	 * @param {Boolean} isAmPmMode - false if 24h mode
	 * @return {String} time string, i.e. '12:30 pm' 
	 */
	function _printTime(hour, minute, pattern, isAmPmMode) {
		var displayminute = _zeroPadTime(minute);
		var displayHour = hour;
		//console.log('print time', hour, minute);

		if (isAmPmMode) {
			if (hour > 12) {
				displayHour = hour - 12;
			} else if (hour == 0) {
				displayHour = 12;
			}
			pattern = pattern.replace(hour < 12 ? 'p' : 'a', '');
		}
		return pattern.replace('H', displayHour).replace('M', displayminute);
	}

	/**
	 * Assemble the html containing each appointment represented by a button
	 * @param {Object} opt - options (see above)
	 * @param {Object} tpl - template (see above)
	 * @param {Array} intervals - array holding interval permutations
	 */
	function _assemblePicker(opt, tpl, intervals) {
		var start = opt.startTime;
		var end = opt.endTime;
		var inner = '';
		var isAmPmMode = opt.mode === '12h';
		var timePattern = isAmPmMode ? tpl.time12 : tpl.time24;

		// Iterate hours from starting to ending
		for (var hour = start; hour < end; hour++) {
			// Iterate minutes from possible intervals array
			for (var j = 0; j < intervals.length; j++) {
				var minute = intervals[j];
				var isDisabled = hour < opt.minTime || hour > opt.maxTime;
				var timeTemplate = _printTime(hour, minute, timePattern, isAmPmMode);
				// Replace timeTemplate placeholders with time and disabled flag
				inner += tpl.inner
					.replace('{{time}}', timeTemplate)
					.replace('{{disabled}}', isDisabled ? 'disabled': '');
			}
		}

		return tpl.outer
			.replace('{{classes}}', opt.large ? 'is-large': '')
			.replace('{{title}}', opt.title)
			.replace('{{innerHtml}}', inner);
	}

	return AppointmentPicker;
}));