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
			title: 'Pick your appointment time'
		};

		this.template = {
			inner: '<li class="appo-picker-list-item {{classLi}}">' +
				'<button data-time="{{time}}">{{btnLabel}}</button></li>',
			outer: '<div class="appo-picker-title">' + this.options.title +
				'</div><ul class="appo-picker-list">{{innerHtml}}</ul>'
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

	AppointmentPicker.prototype.open = function(e) {
		if (this.isOpen) return;
		if (!this.isInDom) this.picker = this.build();

		this.isOpen = true;

		console.log('open picker =>', this.picker);
	}

	AppointmentPicker.prototype.build = function() {
		var node = document.createElement('div');
		node.className = 'appo-picker';
		node.tabIndex = '-1';
		node.innerHTML = _assemblePicker(this);
		this.el.insertAdjacentElement('afterend', node);
		return node;
	}

	AppointmentPicker.prototype.position = function() {}

	function _assemblePicker(_this) {
		//console.log('assemble', outer, inner);
		var times = 0;
		var outer = '';
		var inner = '';

		switch (_this.options.mode) {
			case '12h':
				times = 12 * (60 / _this.options.interval);
				break;
			default:
				times = 24 * (60 / _this.options.interval);
		}

		for (var i = 0; i < times; i++) {
			inner += _this.template.inner;
		}

		outer = _this.template.outer.replace('{{innerHtml}}', inner);
		//.replace('{{styles}}', 'top: 100px, left: 100px;')

		return outer;
	}

	return AppointmentPicker;
}));