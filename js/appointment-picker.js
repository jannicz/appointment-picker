/**
 * Appointment-Picker
 *
 * @module Appointment-Picker
 * @version 0.2.0
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
		this.currentTime = [];
		this.selectionEventFn = this.select.bind(this);
		this.changeEventFn = this.onchange.bind(this);
		this.closeEventFn = this.close.bind(this);
		this.openEventFn = this.open.bind(this);
		this.tabkeyEventFn = this.tabKeyInput.bind(this);

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
			console.warn('appointment-picker error: please pass only one dom-element as argument');
			return;
		} else if (_this.options.interval > 60) {
			console.warn('appointment-picker error: the maximal interval in 60');
			return;
		}

		_this.setTime(_this.el.value);

		el.addEventListener('focus', _this.openEventFn);
		el.addEventListener('keyup', _this.tabkeyEventFn);
		el.addEventListener('change', _this.changeEventFn);
	}

	// Attach visibility classes and set the picker's position
	AppointmentPicker.prototype.render = function() {
		//console.log('render, entered time =>', this.el.value);

		if (this.isOpen) {
			this.picker.classList.add('is-open');
			this.el.setAttribute('aria-expanded', true);
		} else {
			this.picker.classList.remove('is-open');
			this.el.setAttribute('aria-expanded', false);
		}
		//.replace('{{styles}}', 'top: 100px, left: 100px;')
	}

	/**
	 * Opens the picker, registers further click events
	 * @param {Event} e - some event
	 */
	AppointmentPicker.prototype.open = function(e) {
		var _this = this;

		if (this.isOpen) return;
		if (!this.isInDom) {
			this.picker = this.build();
			this.isInDom = true;
		}

		_this.isOpen = true;
		_this.render();
		
		this.picker.addEventListener('click', this.selectionEventFn);
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
		document.removeEventListener('click', this.closeEventFn);
	}

	/**
	 * Listener for an appointment selection
	 * @param {Event} e - mouse click or keyboard event
	 */
	AppointmentPicker.prototype.select = function(e) {
		var _this = this;
		if (!e.target.value) return;

		this.el.value = e.target.value;

		this.currentTime = _parseTime(e.target.value);

		console.log('select event, currentTime =>', this.currentTime);

		setTimeout(function() {
			_this.close();
		}, 100);
	}

	AppointmentPicker.prototype.onchange = function(e) {
		this.setTime(this.el.value);
		console.log('change event, currentTime =>', this.currentTime);		
	}

	AppointmentPicker.prototype.tabKeyInput = function(e) {
		//console.log('keyup', e);

		if ((e.keyCode === 16 || e.keyCode === 9) && this.isOpen) {
			// this.close(e);
		}
	}

	// Create a dom node containing the markup for the picker
	AppointmentPicker.prototype.build = function() {
		var node = document.createElement('div');
		node.innerHTML = _assemblePicker(this.options, this.template);
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
		var isPm = /pm/i.test(time[2]);
		var is24h = this.options.mode === '24h';

		// Bump the hour by 12 if the value is PM
		// FIXME might be wrong doing this with 12pm
		var hour = isPm ? Number(time[0]) + 12 : Number(time[0]);

		console.log('time to set', time, 'hour', hour, 'is24h', is24h);

		// If input time does not pass the min/max limits, it will not be applied
		if (!time.length) {
			console.log('wrong format');
		} else if (hour < this.options.minTime || hour > this.options.maxTime) {
			console.log('too low / too low', hour, this.options.minTime);
			
		} else if (hour > 24) {
			console.log('wrong format');
		} else {
			this.currentTime = time;
		}

		if (this.currentTime.length) {
			var ct = this.currentTime;
			this.el.value = ct[0] + ':' + ct[1] + (!is24h ? ' ' + ct[2] : '');
		}
	}

	// Exposed time getter
	AppointmentPicker.prototype.getTime = function() {
		return this.currentTime;
	}

	/**
	 * Add a leading zero and converts to string i
	 * @param {Number} number - number that needs to be padded
	 * @returns {String} i.e. '05'
	 */
	function _zeroPadTime(number) {
		if (/^[0-9]{1}$/.test(number))
			return '0' + number;
		return number;
	}

	/**
	 * @param {String} time - time that needs to be parsed, i.e. '11:15PM '
	 * @returns {Array} containing [hour, minute, am/pm/24h]
	 */
	function _parseTime(time) {
		var match = time.match(/^([\d]{1,2}):([\d]{2})[\s]*([ap][m])?.*$/);
		if (match) return [match[1], match[2], match[3] ? match[3] : '24h'];
		return [];
	}

	/**
	 * Assemble the html containing each appointment represented by a button
	 * @param {Object} opt - options (see above)
	 * @param {Object} tpl - template (see above)
	 */
	function _assemblePicker(opt, tpl) {
		var start = opt.startTime;
		var end = opt.endTime;
		var times = end * (60 / opt.interval);
		var inner = '';
		var hour = 0;
		var countPerHour = 1;
		var outer, label;
		var perHour = 60 / opt.interval;
		var isAmPmMode = opt.mode === '12h';
		var timePattern = isAmPmMode ? tpl.time12 : tpl.time24;

		// Iterate all appointment times based on start, end and interval
		for (var i = 0; i < times; i++) {
			var isFullHour, minute, displayminute, displayHour;
			var timeTemplate = timePattern;
			var isDisabled = false;

			isFullHour = perHour === countPerHour;
			displayHour = isAmPmMode && hour > 12 ? hour - 12 : hour;
			minute = opt.interval * (countPerHour - 1);
			displayminute = _zeroPadTime(opt.interval * (countPerHour - 1));
			isDisabled = hour < opt.minTime || hour > opt.maxTime;

			if (isAmPmMode) {
				timeTemplate = timePattern.replace(hour < 12 ? 'p' : 'a', '');
			}

			if (start <= hour) {
				// Replace timeTemplate placeholders with time, disabled flag and label
				inner += tpl.inner
					.replace('{{time}}', timeTemplate
						.replace('H', displayHour)
						.replace('M', displayminute))
					.replace('{{disabled}}', isDisabled ? 'disabled': '');
			}

			if (isFullHour) {
				hour++;
				countPerHour = 1;
			} else {
				countPerHour++;
			}
		}

		return outer = tpl.outer
			.replace('{{classes}}', opt.large ? 'is-large': '')
			.replace('{{title}}', opt.title)
			.replace('{{innerHtml}}', inner);
	}

	return AppointmentPicker;
}));