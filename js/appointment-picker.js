/**
 * Appointment-Picker
 *
 * @module Appointment-Picker
 * @version 0.1.0
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

	var AppointmentPicker = function($el, el, options) {
		// console.log('AppointmentPicker constructor, options =>', options, $el, el, this);

		this.options = {
			interval: 30, // Appointment intervall in minutes
			minTime: '8:00', // min and max pickable time of the day
			maxTime: '18:00',
			mode: '24h', // Whether to use 24h or 12h w/ am/pm
			validate: false, // Whether to invalidate if wrong or outside range
			title: 'Pick your time'
		};

		this.template = {
			inner: '<li class="appo-picker-list-item">' +
				'<button data-time="{{time}}">{{btnLabel}}</button></li>',
			outer: '<div class="appo-picker-title">' + this.options.title +
				'</div><ul class="appo-picker-list">{{innerHtml}}</ul>',
			time12: 'H:M ap.m.',
			time24: 'H:M'
		};
		this.el = el;
		this.picker = null;
		this.isOpen = false;
		this.isInDom = false;

		initialize(this, el, options || {});
	};

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
	}

	// Opens the picker
	AppointmentPicker.prototype.open = function(e) {
		if (this.isOpen) return;
		if (!this.isInDom) this.picker = this.build();

		this.isOpen = true;

		console.log('open picker =>', this.picker);
	}

	// Create a dom node containing the markup for the picker
	AppointmentPicker.prototype.build = function() {
		var node = document.createElement('div');
		node.className = 'appo-picker';
		node.tabIndex = '-1';
		node.innerHTML = _assemblePicker(this.options, this.template);
		this.el.insertAdjacentElement('afterend', node);
		return node;
	}

	AppointmentPicker.prototype.position = function() {
		//.replace('{{styles}}', 'top: 100px, left: 100px;')
	}

	// Add a leading zero and converts to string if number <10
	function _zeroPadTime(number) {
		if (/^[0-9]{1}$/.test(number))
			return '0' + number;
		return number;
	}

	// Assemble the html containing each appointment represented by a button
	function _assemblePicker(opt, tpl) {
		//console.log('assemble', outer, inner);
		var times = 24 * (60 / opt.interval);
		var inner = '';
		var hour = 0;
		var appoCount = 1;
		var outer, label;
		var perHour = 60 / opt.interval;
		var timeTpl = opt.mode === '12h' ? tpl.time12 : tpl.time24;
		var isAmPmMode = opt.mode === '12h';

		// Iterate all appointment times based on start, end and interval
		for (var i = 0; i < times; i++) {
			var isFullHour, minute, displayHour, template = timeTpl;

			isFullHour = perHour === appoCount;
			displayHour = isAmPmMode && hour > 12 ? hour - 12 : hour;
			minute = _zeroPadTime(opt.interval * (appoCount - 1));

			if (isAmPmMode) {
				template = timeTpl.replace(hour < 12 ? 'p' : 'a', '');
			}
			
			inner += tpl.inner.replace(/{{btnLabel}}/,
				template.replace('H', displayHour).replace('M', minute
			)).replace(/{{time}}/, hour + ':' + minute);

			if (isFullHour) {
				hour++;
				appoCount = 1;
			} else {
				appoCount++;
			}
		}

		return outer = tpl.outer.replace('{{innerHtml}}', inner);
	}

	return AppointmentPicker;
}));