/**
 * Appointment-Picker - a lightweight, accessible and customizable timepicker
 *
 * @module Appointment-Picker
 * @version 1.0.6
 *
 * @author Jan Suwart
*/
(function (root, factory) {
	if (typeof exports === 'object') {
		module.exports = factory(root); // CommonJS (Node, Browserify, Webpack)
	} else if (typeof define === 'function' && define.amd) {
		define('appointment-picker', [], function () {
			return factory(root); // AMD (RequireJS)
		});
	} else {
		root.AppointmentPicker = factory(root); // Browser globals (root = window)
	}
}(this, function() {
	'use strict';

	/**
	 * Constructor
	 * @param {HTMLElement} el - reference to the time input field
	 * @param {Object} options - user defined options
	 */
	var AppointmentPicker = function(el, options) {
		this.options = {
			interval: 60, // Appointment intervall in minutes
			minTime: 0, // min pickable hour (1-24)
			maxTime: 24, // max pickable hour (1-24)
			startTime: 0, // min displayed hour (1-24)
			endTime: 24, // max displayed hour (1-24)
			disabled: [], // Array of disabled times, i.e. ['10:30', ...]
			mode: '24h', // Whether to use 24h or 12h system
			large: false, // Whether large button style
			static: false, // Whether to position static (always open)
			title: 'Timepicker' // Title in opened state
		};
		this.template = {
			inner: '<li class="appo-picker-list-item {{disabled}}">' +
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
		this.time = {}; // { h: '18', m: '30' }
		this.intervals = []; // [0, 15, 30, 45]
		this.disabledArr = [];
		this.displayTime = ''; // '6:30pm'
		this.selectionEventFn = _onselect.bind(this);
		this.changeEventFn = _onchange.bind(this);
		this.closeEventFn = this.close.bind(this);
		this.openEventFn = this.open.bind(this);
		this.keyEventFn = _onKeyPress.bind(this);
		this.bodyFocusEventFn = _onBodyFocus.bind(this);

		initialize(this, el, options || {});
	};

	/**
	 * Initialize the picker, merge default options and check for errors
	 * @param {Object} _this - this view reference
	 * @param {HTMLElement} el - reference to the time input field
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
		// Create 2-dim array holding all disabled times
		_this.disabledArr = _this.options.disabled.map(function(item) {
			return _parseTime(item);
		});

		// Create array holding all minute permutations
		for (var j = 0; j < 60 / _this.options.interval; j++) {
			_this.intervals[j] = j * _this.options.interval;
		}

		_this.setTime(_this.el.value);
		el.addEventListener('keyup', _this.keyEventFn);
		el.addEventListener('change', _this.changeEventFn);

		if (!_this.options.static) { // Default positioning 
			el.addEventListener('focus', _this.openEventFn);
		} else {
			// Render the picker in position static, don't register onOpen event
			_this.picker = _build(_this);
			_this.picker.classList.add('is-position-static');
			_this.picker.addEventListener('click', _this.selectionEventFn);
			_this.isOpen = true;
			_this.render();
		}
	};

	// Attach visibility classes and set the picker's position
	AppointmentPicker.prototype.render = function() {
		if (this.isOpen) {
			var bottom = this.el.offsetTop + this.el.offsetHeight;
			var left = this.el.offsetLeft;
			var oldSelectedEl = this.picker.querySelector('input.is-selected');

			this.picker.classList.add('is-open');

			if (oldSelectedEl) {
				oldSelectedEl.classList.remove('is-selected');
			}
			if (this.time.hasOwnProperty('h')) {
				var selectedEl = this.picker.querySelector('[value="' + this.displayTime + '"]');
				
				if (selectedEl) {
					selectedEl.classList.add('is-selected');
				}
			}
			if (!this.options.static) {
				this.picker.style.top = bottom + 'px';
				this.picker.style.left = left + 'px';
			}
		} else {
			this.picker.classList.remove('is-open');
		}
	};

	// Opens the picker, registers further click events
	AppointmentPicker.prototype.open = function() {
		var _this = this;

		if (this.isOpen) return;

		if (!this.isInDom) {
			this.picker = _build(_this);
			this.isInDom = true;
		}

		this.isOpen = true;
		this.render();
		this.picker.addEventListener('click', this.selectionEventFn);
		this.picker.addEventListener('keyup', this.keyEventFn);
		// Delay document click listener to prevent picker flashing
		setTimeout(function() {
			document.body.addEventListener('click', _this.closeEventFn);
			document.body.addEventListener('focus', _this.bodyFocusEventFn, true);	
		}, 100);
	};

	/**
	 * Close the picker and unregister attached events
	 * @param {Event|null} e - i.e. mouse click event
	 */
	AppointmentPicker.prototype.close = function(e) {
		if (!this.isOpen) return;

		// Polyfil matches selector if missing
		if (!Element.prototype.matches)
			Element.prototype.matches = Element.prototype.msMatchesSelector ||
				Element.prototype.webkitMatchesSelector;
		if (e) {
			var el = e.target;
			if (el.isEqualNode(this.el)) return;
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
		document.body.removeEventListener('click', this.closeEventFn);
		document.body.removeEventListener('focus', this.bodyFocusEventFn, true);
	};

	/**
	 * Listener for an appointment selection
	 * @param {Event} e - mouse click or keyboard event
	 */
	function _onselect(e) {
		var _this = this;
		if (!e.target.value) return;

		this.setTime(e.target.value);
		
		if (_this.options.static) {
			this.render();
		} else {
			this.el.focus();
			setTimeout(function() { _this.close(null); }, 100);
		}
	};

	// Handles manual input changes on input field
	function _onchange(e) {
		this.setTime(this.el.value);
	};

	/**
	 * Move focus forward and backward on keyboard arrow key, close picker on ESC
	 * @param {Event} e - keyboard event
	 */
	function _onKeyPress(e) {
		var first = this.picker.querySelector('input[type="button"]:not([disabled])');
		var selected = this.picker.querySelector('input.is-selected');
		var next = null;

		switch (e.keyCode) {
			case 13: // Enter
			case 27: // ESC
				this.close(null);
				break;
			case 38: // Up Arrow
				next = selected ? _getNextSibling(selected.parentNode, -1) : first.parentNode;
				break;
			case 40: // Down Arrow
				next = selected ? _getNextSibling(selected.parentNode, 1) : first.parentNode;
				break;
			default:
		}

		if (next && !next.firstChild.disabled) {
			next.firstChild.classList.add('is-selected');
			if (selected)
				selected.classList.remove('is-selected');
			this.setTime(next.firstChild.value);
		}
	};

	// Close the picker on document focus, usually by hitting TAB
	function _onBodyFocus(e) {
		if (!this.isOpen) return;
		this.close(e);
	};

	// Remove the picker's node from the dom and unregister all events
	AppointmentPicker.prototype.destroy = function() {
		this.close(null);

		if (this.picker) {
			this.picker.parentNode.removeChild(this.picker);
			this.picker = null;
		}
		this.el.removeEventListener('focus', this.openEventFn);
		this.el.removeEventListener('keyup', this.keyEventFn);
		this.el.removeEventListener('change', this.changeEventFn);
	};

	/**
	 * Sets the pickers current time variable after validating for min/max
	 * @param {String} value - time input string, i.e. '12:15pm'
	 */
	AppointmentPicker.prototype.setTime = function(value) {
		var time = _parseTime(value);
		var is24h = this.options.mode === '24h';
		var timePattern = is24h ? this.template.time24 : this.template.time12;

		if (!time && !value) { // Empty string, reset time
			this.time = {};
			this.displayTime = '';
		} else if (time) { // A time format was recognized
			var hour = time.h;
			var minute = time.m;
			var isValid = _isValid(hour, minute, this.options, this.intervals, this.disabledArr);

			if (isValid) {
				this.time = time;
				this.displayTime = _printTime(this.time.h, this.time.m, timePattern, !is24h);
				// Trigger an event with attached time property
				var event = document.createEvent('Event');
				event.initEvent('change.appo.picker', true, true);
				event.time = this.time;
				this.el.dispatchEvent(event);
			}
		}
		this.el.value = this.displayTime;
	};

	// Time getter returns time as 24h
	AppointmentPicker.prototype.getTime = function() {
		return this.time;
	};

	/**
	 * Checks validity using defined constraints
	 * @returns {Boolean} true if valid
	 */
	function _isValid(hour, minute, opt, intervals, disabledArr) {
		var inDisabledArr = false;
		if (hour < opt.minTime || hour > opt.maxTime || hour > 24) { // Out of min/max
			return false;
		} else if (intervals.indexOf(minute) < 0) { // Min doesn't match any interval
			return false;
		}
		disabledArr.forEach(function(item, i) { // h:m combination in disabled array
			if (item.h === hour && item.m === minute)
				inDisabledArr = true;
		});

		return !inDisabledArr ? true : false; // All valid
	};

	/**
	 * Add a leading zero and convert to string
	 * @param {Number} number - number that needs to be padded
	 * @returns {String} i.e. '05'
	 */
	function _zeroPadTime(number) {
		if (/^[0-9]{1}$/.test(number))
			return '0' + number;
		return number;
	};

	/**
	 * @param {String} time - string that needs to be parsed, i.e. '11:15PM ' or '10:30 am'
	 * @returns {Object|undefined} containing {h: hour, m: minute} or undefined if unrecognized
	 * @see https://regexr.com/3heaj
	 */
	function _parseTime(time) {
		var match = time.match(/^\s*([\d]{1,2}):([\d]{2})[\s]*([ap][m])?.*$/i);

		if (match) {
			var hour = Number(match[1]);
			var minute = Number(match[2]);
			var postfix = match[3];

			if (/pm/i.test(postfix) && hour !== 12) {
				hour += 12;
			} else if (/am/i.test(postfix) && hour === 12) {
				hour = 0;
			}
			return { h: hour, m: minute };
		}
		return;
	};

	/**
	 * Create time considering am/pm conventions
	 * @param {Number} hour 
	 * @param {Number} minute
	 * @param {String} pattern - used time format
	 * @param {Boolean} isAmPmMode - false if 24h mode
	 * @return {String} time string, i.e. '12:30 pm' 
	 */
	function _printTime(hour, minute, pattern, isAmPmMode) {
		var displayHour = hour;

		if (isAmPmMode) {
			if (hour > 12) {
				displayHour = hour - 12;
			} else if (hour == 0) {
				displayHour = 12;
			}
			pattern = pattern.replace(hour < 12 ? 'p' : 'a', '');
		}

		return pattern.replace('H', displayHour).replace('M', _zeroPadTime(minute));
	};

	// Find next sibling of item that is not disabled (otherwise return null)
	function _getNextSibling(item, direction) {
		if (!item) return null; // Break condition for recursion

		var next = direction < 0 ? item.previousElementSibling : item.nextElementSibling;
		if (next && next.className.indexOf('disabled') < 0) {
			return next;
		} else { // If disabled class found, try the next sibling
			return _getNextSibling(next, direction);
		}
	};

	// Create a dom node containing the markup for the picker
	function _build(_this) {
		var node = document.createElement('div');
		node.innerHTML = _assemblePicker(_this.options, _this.template, _this.intervals, _this.disabledArr);
		node.className = ('appo-picker' + (_this.options.large ? ' is-large' : ''));
		node.setAttribute('aria-hidden', true);
		_this.el.insertAdjacentElement('afterend', node);

		return node;
	};

	/**
	 * Assemble the html containing each appointment represented by a button
	 * @param {Object} opt - options (see above)
	 * @param {Object} tpl - template (see above)
	 * @param {Array} intervals - array holding interval permutations
	 * @param {Array} disabledArr - array holding disabled times
	 */
	function _assemblePicker(opt, tpl, intervals, disabledArr) {
		var start = opt.startTime;
		var end = opt.endTime;
		var inner = '';
		var isAmPmMode = opt.mode === '12h';
		var timePattern = isAmPmMode ? tpl.time12 : tpl.time24;

		for (var hour = start; hour < end; hour++) { // Iterate hours start to end	
			for (var j = 0; j < intervals.length; j++) { // Iterate minutes by possible intervals
				var minute = intervals[j];
				var isDisabled = !_isValid(hour, minute, opt, intervals, disabledArr);
				var timeTemplate = _printTime(hour, minute, timePattern, isAmPmMode);
				// Replace timeTemplate placeholders with time and disabled flag
				inner += tpl.inner
					.replace('{{time}}', timeTemplate)
					.replace(/{{disabled}}/ig, isDisabled ? 'disabled': '');
			}
		}

		return tpl.outer
			.replace('{{classes}}', opt.large ? 'is-large': '')
			.replace('{{title}}', opt.title)
			.replace('{{innerHtml}}', inner);
	};

	return AppointmentPicker;
}));