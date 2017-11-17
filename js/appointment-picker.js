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

	var AppointmentPicker = function($this, options) {
		console.log('AppointmentPicker constructor, options =>', options, $this, this);

		this.options = {
			interval: 30, // Appointment intervall in minutes
			minTime: '8:00', // min and max pickable time of the day
			maxTime: '18:00',
			validate: false // Whether to invalidate if wrong or outside range
		};

		initialize(this, options || {});
	};

	function initialize(_this, options) {
		for (var opt in options) {
			_this.options[opt] = options[opt];
		}

		console.log('initialize with merged options', _this.options);
	}

	AppointmentPicker.prototype.open = function() {
		console.log('open');

	}

	return AppointmentPicker;
}));