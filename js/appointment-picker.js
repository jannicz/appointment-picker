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
	var AppointmentPicker = function($el, el, options) {
		// console.log('AppointmentPicker constructor, options =>', options, $el, el, this);

		this.options = {
			interval: 30, // Appointment intervall in minutes
			minTime: 0, // min and max pickable hour
			maxTime: 24,
			startTime: 0, // min and max displayed hour
			endTime: 24,
			mode: '24h', // Whether to use 24h or 12h system
			validate: false, // Whether to invalidate if wrong or outside range
			title: 'Pick your time'
		};

		this.template = {
			inner: '<li class="appo-picker-list-item">' +
				'<button data-time="{{time}}" {{disabled}}>{{btnLabel}}</button></li>',
			outer: '<div class="appo-picker-title">' + this.options.title +
				'</div><ul class="appo-picker-list">{{innerHtml}}</ul>',
			time12: 'H:M ap.m.',
			time24: 'H:M'
		};
		this.el = el;
		this.picker = null;
		this.isOpen = false;
		this.isInDom = false;
		this.selectionEventFn = this.select.bind(this);
		this.closeEventFn = this.close.bind(this);

		initialize(this, el, options || {});
	};

	/**
	 * Initialize the picker, merge default options
	 * @param {Object} _this - this view reference
	 * @param {DOMnode} el - reference to the time input field
	 * @param {Object} options - user defined options
	 */
	function initialize(_this, el, options) {
		for (var opt in options) {
			_this.options[opt] = options[opt];
		}

		console.log('initialize', _this);

		if (_this.el.length !== undefined) {
			console.error('The picker can only be initialized for one element at once');
			return;
		}

		el.addEventListener('focus', _this.open.bind(_this));
		el.addEventListener('keyup', _this.tabKeyInput.bind(_this));
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
		
		this.picker.addEventListener('click', this.selectionEventFn);
			_this.isOpen = true;
			_this.render();

		setTimeout(function() {
			// Delay document click listener to prevent picker flashing
			document.addEventListener('click', _this.closeEventFn);
		}, 50);
	}

	/**
	 * Close the picker and unregister attached events
	 * @param {Event} e - might be mouse click event
	 */
	AppointmentPicker.prototype.close = function(e) {
		if (!this.isOpen) return;

		var el = e.target;

		// Check if the clicked target is inside the picker
	    while (el) {
	        if (el.matches('.appo-picker')) return;
        	el = el.parentElement;
    	}
    	// The target was outside, close the picker
    	this.isOpen = false;
    	this.render();

		this.picker.removeEventListener('click', this.selectionEventFn);
		document.removeEventListener('click', this.closeEventFn);

		//console.log('close picker, unregister events', e);
	}

	/**
	 * Listener for an appointment selection
	 * @param {Event} e - mouse click or keyboard event
	 */
	AppointmentPicker.prototype.select = function(e) {
		console.log('select', e.target);
	}

	AppointmentPicker.prototype.tabKeyInput = function(e) {
		console.log('keyup', e);

		if ((e.keyCode === 16 || e.keyCode === 9) && this.isOpen) {
			// this.close(e);
		}
	}

	/**
	 * Create a dom node containing the markup for the picker
	 */
	AppointmentPicker.prototype.build = function() {
		var node = document.createElement('div');
		node.className = 'appo-picker';
		node.innerHTML = _assemblePicker(this.options, this.template);
		this.el.insertAdjacentElement('afterend', node);
		return node;
	}

	/**
	 * Attach visibility classes and set the picker's position
	 */
	AppointmentPicker.prototype.render = function() {
		console.log('render, isOpen =>', this.isOpen, this.picker);
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
	 * Add a leading zero and converts to string if number <10
	 * @param {Number} number - number that needs to be padded
	 * @returns {String} i.e. '05'
	 */
	function _zeroPadTime(number) {
		if (/^[0-9]{1}$/.test(number))
			return '0' + number;
		return number;
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
			var template = timePattern;
			var isDisabled = false;

			isFullHour = perHour === countPerHour;
			displayHour = isAmPmMode && hour > 12 ? hour - 12 : hour;
			minute = opt.interval * (countPerHour - 1);
			displayminute = _zeroPadTime(opt.interval * (countPerHour - 1));
			isDisabled = hour < opt.minTime || hour > opt.maxTime;

			if (isAmPmMode) {
				template = timePattern.replace(hour < 12 ? 'p' : 'a', '');
			}

			if (start <= hour) {
				// Replace template placeholders with time, disabled flag and label
				inner += tpl.inner
					.replace(/{{btnLabel}}/, template
						.replace('H', displayHour)
						.replace('M', displayminute))
					.replace(/{{time}}/, hour + ':' + displayminute)
					.replace('{{disabled}}', isDisabled ? 'disabled': '');
			}

			if (isFullHour) {
				hour++;
				countPerHour = 1;
			} else {
				countPerHour++;
			}
		}

		return outer = tpl.outer.replace('{{innerHtml}}', inner);
	}

	return AppointmentPicker;
}));