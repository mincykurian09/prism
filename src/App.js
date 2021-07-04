import './App.css';
import React, { Component } from 'react';
import axios from 'axios';
import icon from './assets/close.jpg';
import navicon from './assets/nav.png';  

const URLS = {
    scheduleBaseUrl:"http://localhost:3004/schedules",
    scheduleLogBaseUrl:"http://localhost:3004/scheduleLogs"
}

const appStyles = {    
    label: {
        width: 90,
        fontWeight: "bold",
        verticalAlign: "top"
    },
    icon: {
        width: 20,
        padding:1
    },
    navicon: {
        height: 45          
    },
    error: {
        margin: 10,
        color:'red'          
    }
};

export default class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            schedulesList: [],
            logsList: [],
            selectedId: '',
            loading: false,
            visibleItems:[],
            logfilterValues:[],
            selectValue:'',
            filteredLogList:[],
            isError: false
        }
    }

    componentDidMount() {

        axios.get(URLS.scheduleBaseUrl)
        .then(response => {
            let scheduleList = response.data || [];
            let firstSchedule = {};

            if (scheduleList.length !== 0) {
                firstSchedule = scheduleList[0];
            }

            this.setState((state) => ({
                schedulesList: scheduleList               
            }));
            this.changeLogList(firstSchedule);
        })
        .catch(error => {
            this.setState((state) => ({
                isError: true               
            }));
        })
    }    

    changeLogList(scheduleObj) {
        
        let scheduleId = scheduleObj.id;
        let currentScheduleId = this.state.selectedId;
        let currentLogList = this.state.logsList;

        if(scheduleId === currentScheduleId){
            
            this.setState((state, props) => ({
                selectedId: scheduleId,
                logsList: currentLogList
            }));
            return;
        }

        let url = URLS.scheduleLogBaseUrl+"?scheduleId=" + scheduleId;
        axios.get(url)
        .then(response => {
            let logsList = response.data || [];
            let filterArray = this.getFilterArray(logsList);
            this.setState((state, props) => ({
                selectedId: scheduleId,
                logsList: logsList,
                selectValue:"All",
                logfilterValues:filterArray,
                filteredLogList:logsList,
                isError: false
            }));
        })
        .catch(error => {
            this.setState((state) => ({
                isError: true               
            }));
        });
    }

    retireOrUnretireJob(scheduleObj) {

        let scheduleId = scheduleObj.id;
        let currentStatus = scheduleObj.isRetired;
        let newStatus =  (currentStatus === false ? true: false); 

        scheduleObj.isRetired = newStatus;

        let url = URLS.scheduleBaseUrl+ "/" + scheduleId;
        axios.put(url, scheduleObj)
        .then(response => {})
        .catch(error => {
            scheduleObj.isRetired = currentStatus;
        });        
    }

    convertDate(dateStr){
        if(!dateStr){
            return '';
        }
        let date = new Date(dateStr);
        let convertedDate = date.toLocaleString("en-GB");
        return convertedDate;
    }   

    isVisible(scheduleId){

        let index = this.state.visibleItems.indexOf(scheduleId);
        let isVisible = (index >=0 ? true:false);
        return isVisible;
    }

    hideShowDetails(scheduleId){

        let visibleItems = this.state.visibleItems;            
        if(this.isVisible(scheduleId)){
            var index = visibleItems.indexOf(scheduleId);
            visibleItems.splice(index,1);
            return;
        }
        visibleItems.push(scheduleId);
    }

    getFilterArray(logsList){
        
        let filterArray = ["All"];
        logsList.forEach(function(logObj){
            let status = logObj.status;
            let isAvailable = (filterArray.indexOf(status) >=0 ? true:false);
            if(!isAvailable){
                filterArray.push(status);
            }
        })

        return filterArray;
    }

    handleChange(event){
        let currentVal = event.target.value;        
        this.setState((state) => ({
            selectValue: currentVal
        }));

        this.filterLogItems(currentVal);        
    }

    getClassNames(scheduleId){
        var className = "schedule";
        if(this.state.selectedId === scheduleId){
            className = className + ' selected';
        }
       
        return className;
    }

    filterLogItems(filterVal){
        
        let logItemsList = this.state.logsList;
        if(filterVal === 'All'){
            this.setState((state) => ({
                filteredLogList: logItemsList
            }));
            return;
        }

        let filteredLogList = [];
        logItemsList.forEach(function(logObj){
            let status = logObj.status;
            if(status === filterVal){
                filteredLogList.push(logObj);
            }
        })

        this.setState((state) => ({
            filteredLogList: filteredLogList
        }));
    }

    render() {
        const { isError, filteredLogList} = this.state;
        return (
            <div className="App">
            <header>
                <h1>Schedules</h1>
                <nav>
                    <img src={navicon} alt="Navigation List" style={appStyles.navicon} />
                </nav>
                <div style={{clear:'both'}}></div>          
            </header>
            <div className="content">       
                <section className="schedules">
                    <div>
                        <ul>
                            {this.state.schedulesList.map((schedules, index) => {
                                let buttonLabel =  (schedules.isRetired === false ? "Retire":"UnRetire");                   
                                return(
                                    <li key={schedules.id}  onClick={() => this.changeLogList(schedules)} onKeyPress={() => this.changeLogList(schedules)}>
                                      <div className={this.getClassNames(schedules.id)} tabIndex={index+1}>
                                        <div>
                                            <img src={icon} alt="Delete Schedule" style={appStyles.icon} />
                                        </div>
                                        <label>Name: </label><span>{schedules.name}</span><br/>
                                        <label>Description: </label><span>{schedules.description}</span><br/>
                                        <label>Tasks Count: </label><span>{schedules.tasksCount}</span><br/>
                                        <label>Start Date: </label><span>{this.convertDate(schedules.startDate)}</span><br/>
                                        <label>End Date: </label><span>{this.convertDate(schedules.endDate)}</span><br/>
                                        {
                                            this.isVisible(schedules.id) === false ?
                                            <div className="more_link" onClick={() => this.hideShowDetails(schedules.id)}> Load More ></div> 
                                            :
                                            <div>
                                                <label>Day of Week: </label><span>{schedules.dayOfWeek}</span><br/>
                                                <label>Day of Month: </label><span>{schedules.dayOfMonth}</span><br/>
                                                <label>Start Point: </label><span>{this.convertDate(schedules.startPoint)}</span><br/>
                                                <label>End Point: </label><span>{this.convertDate(schedules.endPoint)}</span><br/>
                                                <label>Time Period: </label><span>{schedules.timePeriod}</span><br/>
                                                <label>Interval Type: </label><span>{schedules.intervalType}</span><br/>
                                                <div className="more_link" onClick={() => this.hideShowDetails(schedules.id)}> Show less</div>
                                            </div> 
                                        }                            
                                        <div>
                                            <button style={{float:'right'}} type="button" onClick={() => this.retireOrUnretireJob(schedules)}>
                                                <span>{buttonLabel}</span>
                                            </button>
                                            <div style={{clear:'both'}}></div>
                                        </div>
                                        </div>
                                    </li>
                                 )
                            })}
                        </ul>
                    </div>
                </section>
                <section className="logs">
                    {isError && <div style={appStyles.error}>Error occured. Please try again later.</div>}
                    {filteredLogList.length === 0 ? '' :
                        <div>               
                            <div className="filter_select">
                                <label><b>Filter by Status : </b></label>
                                <select name="sort" value={this.state.selectValue} onChange={(event) => this.handleChange(event)}>
                                    {this.state.logfilterValues.map((item,index) => {                    
                                        return(
                                            <option key={index} value={item}>{item}</option>                      
                                        )
                                    })}                                 
                                </select>                   
                            </div>
                            <div style={{clear:'both'}}></div>
                        </div>
                    }
                    <ul>      
                        {this.state.filteredLogList.map((log) => {                    
                            return(
                                <li key={log.id}>
                                    <div>                           
                                        <table>
                                            <tbody>
                                                <tr><td style={appStyles.label}>Server Name</td><td>: {log.serverName}</td></tr>
                                                <tr><td style={appStyles.label}>Start Time</td><td>: {this.convertDate(log.startTime)}</td></tr>
                                                <tr><td style={appStyles.label}>End Time</td><td>: {this.convertDate(log.endTime)}</td></tr>
                                                <tr><td style={appStyles.label}>Status</td><td>: {log.status}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </li>                       
                            )
                        })}                 
                    </ul>
                </section>             
            </div>
          </div>
        );
    }
}