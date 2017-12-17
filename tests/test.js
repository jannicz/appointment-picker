/**
 * Appointment-Picker Specs
 *
 * @author Jan Suwart
*/
describe("appointment-picker API test", function() {

	var pickerInstance;
	var assert = chai.assert;
	var inputEl = document.getElementById('time-spec');

	var createKeyboardEv = function(keyCode, el) {
			var event = document.createEvent('Event');
			event.initEvent('keyup', true, true);
			event.keyCode = keyCode;
			el.dispatchEvent(event);
	}

	before(() => {
		pickerInstance = new AppointmentPicker(inputEl, {
			interval: 30,
			mode: '12h',
			maxTime: 18,
			startTime: 09,
			endTime: 21,
			disabled: ['1:30 pm', '2:00 pm', '5:30 pm']
		});

		// Give focus to the input and therefore creating the picker dom elements
		pickerInstance.el.focus();

		console.log('pickerInstance =>', pickerInstance);
	});

	describe("initial value recognition", function() {

		it("applies the initial input value correctly as time", function() {
			assert.isNumber(pickerInstance.getTime().h);
			assert.isNumber(pickerInstance.getTime().m);
			assert.equal(pickerInstance.getTime().h, 14);
			assert.equal(pickerInstance.getTime().m, 30);
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

	});

	describe("time manipulation and parsing", function() {

		var testsAccept = [
			{ args: " 10:00AM",  expected: { h: 10, m: 0 } },
			{ args: " 10:30 ",   expected: { h: 10, m: 30 } },
			{ args: "11:00 foo", expected: { h: 11, m: 0 } },
			{ args: "12:00 pm",  expected: { h: 12, m: 0 } },
			{ args: "1:00pm",    expected: { h: 13, m: 0 } },
			{ args: "4:30 PM",   expected: { h: 16, m: 30 } },
			{ args: "18:00",     expected: { h: 18, m: 0 } },
			{ args: "12:00am",   expected: { h: 0, m: 0 } }
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

	describe("time validation and rejection", function() {

		before(() => {
			pickerInstance.setTime("18:00");
		});

		var testsReject = [
			{ args: "20:00",   expected: { h: 18, m: 0 } },
			{ args: "8:30 pm", expected: { h: 18, m: 0 } },
			{ args: "1:30 PM", expected: { h: 18, m: 0 } },
			{ args: "2:00PM",  expected: { h: 18, m: 0 } },
			{ args: "dh4kj6",  expected: { h: 18, m: 0 } }
		];

		testsReject.forEach(function(test) {
			it('rejects "' + test.args + '" and kepps its old value of 18:00', function() {
				pickerInstance.setTime(test.args);
				var result = pickerInstance.getTime();
				assert.deepEqual(result, test.expected);
			});
		});

	});

	describe("exposed behaviour functions", function() {

		before(() => {
			pickerInstance.setTime("12:00");
			pickerInstance.render();
		});

		it("closes the picker", function(done) {
			this.slow(1000);
			pickerInstance.close();
			assert.notInclude(pickerInstance.picker.classList.toString(), 'is-open');
			setTimeout(done, 300);
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
			assert.deepEqual(result, { h: 12, m: 30 });
			setTimeout(done, 100);
		});

		it("moves selection and skips disabled times using keyboard event function", function(done) {
			this.slow(500);
			// Simulate two events with keyCode 40 = down arrow
			createKeyboardEv(40, inputEl);
			createKeyboardEv(40, inputEl);

			var result = pickerInstance.getTime();
			assert.deepEqual(result, { h: 14, m: 30 });
			setTimeout(done, 100);
		});
	});
});