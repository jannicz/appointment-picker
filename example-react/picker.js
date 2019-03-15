import React from "react";

// Use following imports if used outside this demo project
// import AppointmentPicker from 'appointment-picker';
// import '../../../node_modules/appointment-picker/css/appointment-picker.css';

// Remove following imports if used in your own project
import AppointmentPicker from '../js/appointment-picker';
import '../css/appointment-picker.css';

class AppoPicker extends React.Component {

    constructor(props) {
        super(props);
        this.pickerRef = React.createRef();
        this.onTimeSelect = this.onTimeSelect.bind(this);
    }

    onTimeSelect(event) {
        console.log('change.appo.picker', event.time);
    }

	render() {
        return <input type="text" ref={ this.pickerRef }></input>;
	}

    componentDidMount() {
    	this.picker = new AppointmentPicker(this.pickerRef.current, {});

        this.pickerRef.current.addEventListener('change.appo.picker', this.onTimeSelect);
    }

    componentWillUnmount() {
        this.pickerRef.current.removeEventListener('change.appo.picker', this.onTimeSelect);
        this.picker.destroy();
    }
}

export default AppoPicker;
