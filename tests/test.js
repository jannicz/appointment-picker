/**
 * Appointment-Picker Specs
 *
 * @author Jan Suwart
*/
var createKeyboardEv = function(keyCode, el) {
	var event = document.createEvent('Event');
	event.initEvent('keyup', true, true);
	event.keyCode = keyCode;
	el.dispatchEvent(event);
};

describe("appointment-picker API test (custom template)", function() {

	var pickerInstance;
	var assert = chai.assert;
	var inputEl = document.getElementById('time-spec-2');

	before(function() {
		pickerInstance = new AppointmentPicker(inputEl, {
			interval: 15,
			maxTime: 18,
			startTime: 8,
			leadingZero: true,
			disabled: ['15:00'],
			allowReset: false,
			templateInner: '<li><input type="button" value="{{time}}" {{disabled}}></li>',
			templateOuter: '<ul class="foo">{{innerHtml}}</ul>',
			timeFormat24: 'H.M'
		});

		// Give focus to the input and therefore creating the picker dom elements
		pickerInstance.el.focus();

		console.log('pickerInstance =>', pickerInstance, 'input =>', pickerInstance.el);
	});

	describe("initial value recognition", function() {
		it("applies the initial input value correctly as time", function() {
			assert.isNumber(pickerInstance.getTime().h);
			assert.isNumber(pickerInstance.getTime().m);
			assert.equal(pickerInstance.getTime().h, 14);
			assert.equal(pickerInstance.getTime().m, 30);
		});
	});

	describe("display string time output", function() {
		this.slow(500);

		before(function() {
			pickerInstance.setTime("18:00");
		});

		var testsAccept = [
			{ args: "00:00AM",   expected: "00.00" },
			{ args: "9:30 am",   expected: "09.30" },
			{ args: "12:00 Pm",  expected: "12.00" },
			{ args: "14:30 foo", expected: "14.30" },
			{ args: "15:30 am",  expected: "15.30" },
			{ args: "5:30 P.M.", expected: "17.30" }
		];

		testsAccept.forEach(function(test) {
			it('correctly displays "' + test.args + '" as ' + test.expected, function(done) {
				this.slow(500);
				// Simulate two events with keyCode 40 = down arrow
				createKeyboardEv(40, inputEl);
				pickerInstance.setTime(test.args);
				var result = pickerInstance.el.value;
				assert.deepEqual(result, test.expected);
				setTimeout(done, 100);
			});
		});
	});

	describe("initial value recognition", function() {

		it("correctly pads zero to display time of 09:45", function() {
			this.slow(500);

			pickerInstance.setTime('9:45');
			pickerInstance.open();

			var value = pickerInstance.el.value;

			assert.isNumber(pickerInstance.getTime().h);
			assert.isNumber(pickerInstance.getTime().m);
			assert.equal(pickerInstance.getTime().h, 9);
			assert.equal(pickerInstance.getTime().m, 45);

			assert.isString(pickerInstance.displayTime);
			assert.isString(value);
			assert.equal(pickerInstance.displayTime, '09.45');
			assert.equal(value, '09.45');
		});

		it("prevents time reset via API", function() {
			this.slow(500);

			pickerInstance.setTime('10:15');
			var oldValue = pickerInstance.el.value;
			pickerInstance.setTime('');
			var newValue = pickerInstance.el.value;

			assert.notEqual(pickerInstance.getTime().h, undefined);
			assert.equal(oldValue, newValue);
		});
	});

	describe("destroy functions", function() {
		it("destroys the picker and removes all events", function(done) {
			this.slow(500);
			pickerInstance.setTime('11:00');
			var oldValue = pickerInstance.el.value;
			pickerInstance.destroy();
			pickerInstance.el.focus();

			// Simulate two events with keyCode 40 = down arrow
			createKeyboardEv(40, inputEl);
			createKeyboardEv(40, inputEl);
			var newValue = pickerInstance.el.value;

			assert.equal(pickerInstance.picker, null);
			assert.equal(oldValue, newValue);

			pickerInstance.el.setAttribute('disabled', 'disabled');
			setTimeout(done, 100);
		});
	});
});

describe("appointment-picker API test (default template)", function() {

	var pickerInstance;
	var assert = chai.assert;
	var inputEl = document.getElementById('time-spec');

	before(function() {
		pickerInstance = new AppointmentPicker(inputEl, {
			interval: 30,
			mode: '12h',
			maxTime: 18,
			startTime: 9,
			endTime: 21,
			disabled: ['1:30 pm', '2:00 pm', '5:30 pm']
		});

		// Give focus to the input and therefore creating the picker dom elements
		pickerInstance.el.focus();

		console.log('pickerInstance =>', pickerInstance, 'input =>', pickerInstance.el);
	});

	describe("initial state", function() {
		// it("does not change/set the initial (server side) invalid input time", function() {
		// 	var inputValue = pickerInstance.el.value;
		// 	assert.equal(inputValue, '00:33 foo');
		// });

		it("does not set the initial invalid input value to time/displayTime", function() {
			var displayTime = pickerInstance.displayTime;
			var time = pickerInstance.time;
			assert.equal(displayTime, '');
			assert.deepEqual(time, {});
		});
	});


	describe("dom element creation", function() {

		this.retries(4);

		it("creates the dom element after a focusin", function() {
			assert.isNotNull(pickerInstance.picker);
			assert.isNotNull(pickerInstance.picker.innerHTML);
		});

		it("opens the picker after a focusin", function() {
			assert.include(pickerInstance.picker.classList.toString(), 'appo-picker');
			assert.include(pickerInstance.picker.classList.toString(), 'is-open');
		});

		it("adds is-open class on input element", function() {
			assert.include(inputEl.classList.toString(), 'is-expanded');
		});
	});

	describe("time manipulation and parsing", function() {

		var testsAccept = [
			{ args: " 10:00AM",  expected: { h: 10, m: 0, displayTime: '10:00 am' } },
			{ args: " 10:30 ",   expected: { h: 10, m: 30, displayTime: '10:30 am' } },
			{ args: "11:00 foo", expected: { h: 11, m: 0, displayTime: '11:00 am' } },
			{ args: "12:00 pm",  expected: { h: 12, m: 0, displayTime: '12:00 pm' } },
			{ args: "1:00pm",    expected: { h: 13, m: 0, displayTime: '1:00 pm' } },
			{ args: "4:30 P.M.", expected: { h: 16, m: 30, displayTime: '4:30 pm' } },
			{ args: "18/00",     expected: { h: 18, m: 0, displayTime: '6:00 pm' } },
			{ args: "12.00am",   expected: { h: 0, m: 0, displayTime: '12:00 am' } },
			{ args: "3-00pm",    expected: { h: 15, m: 0, displayTime: '3:00 pm' } }
		];

		testsAccept.forEach(function(test) {
			it('correctly parses "' + test.args + '" into time ' + JSON.stringify(test.expected), function(done) {
				this.slow(500);
				pickerInstance.setTime(test.args);
				pickerInstance.render();
				var result = pickerInstance.getTime();
				assert.deepEqual(result, test.expected);
				setTimeout(done, 100);
			});
		});

	});

	describe("time validation and rejection via API", function() {

		before(function() {
			pickerInstance.setTime("18:00");
		});

		var testsReject = [
			{ args: "20:00",   expected: { h: 18, m: 0, displayTime: '6:00 pm' } },
			{ args: "8:30 pm", expected: { h: 18, m: 0, displayTime: '6:00 pm' } },
			{ args: "1:30 PM", expected: { h: 18, m: 0, displayTime: '6:00 pm' } },
			{ args: "2:00PM",  expected: { h: 18, m: 0, displayTime: '6:00 pm' } },
			{ args: "dh4kj6",  expected: { h: 18, m: 0, displayTime: '6:00 pm' } },
			{ args: "18:30",   expected: { h: 18, m: 0, displayTime: '6:00 pm' } }
		];

		testsReject.forEach(function(test) {
			it('rejects "' + test.args + '" and keeps its old value of 18:00', function() {
				pickerInstance.setTime(test.args);
				var result = pickerInstance.getTime();
				assert.deepEqual(result, test.expected);
			});
		});

	});

	describe("display string time output", function() {

		before(function() {
			pickerInstance.setTime("18:00");
		});

		var testsAccept = [
			{ args: "00:00", expected: "12:00 am" },
			{ args: "9:30", expected: "9:30 am" },
			{ args: "12:00", expected: "12:00 pm" },
			{ args: "15:30", expected: "3:30 pm" }
		];

		testsAccept.forEach(function(test) {
			it('correctly displays "' + test.args + '" as ' + test.expected, function() {
				pickerInstance.setTime(test.args);
				var result = pickerInstance.el.value;
				assert.deepEqual(result, test.expected);
			});
		});
	});

	describe("exposed behaviour functions", function() {

		before(function() {
			pickerInstance.setTime("12:00");
			pickerInstance.render();
		});

		it("closes the picker", function(done) {
			this.slow(1000);
			pickerInstance.close();
			assert.notInclude(pickerInstance.picker.classList.toString(), 'is-open');
			setTimeout(done, 300);
		});

		it("removes is-expanded class on input element", function() {
			assert.notInclude(inputEl.classList.toString(), 'is-expanded');
		});

		it("opens the picker", function(done) {
			this.slow(500);
			pickerInstance.open();
			assert.include(pickerInstance.picker.classList.toString(), 'is-open');
			setTimeout(done, 100);
		});

		it("moves time selection by calling keyboard event function", function(done) {
			this.slow(500);
			// Simulate event with keyCode 40 = down arrow
			createKeyboardEv(40, inputEl);

			var result = pickerInstance.getTime();
			assert.deepEqual(result, { h: 12, m: 30, displayTime: '12:30 pm' });
			setTimeout(done, 100);
		});

		it("moves selection and skips disabled times using keyboard event function", function(done) {
			this.slow(500);
			// Simulate two events with keyCode 40 = down arrow
			createKeyboardEv(40, inputEl);
			createKeyboardEv(40, inputEl);
			pickerInstance.el.blur();

			var result = pickerInstance.getTime();
			assert.deepEqual(result, { h: 14, m: 30, displayTime: '2:30 pm' });
			setTimeout(done, 100);
		});
	});
});
