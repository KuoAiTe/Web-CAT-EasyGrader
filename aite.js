var studentInSection = new Set();
var forceFliter = false;
var autoFilter = false;
var autoShowGrade = false;
var pageType = 0;
var lock = false;
var showUI = false;
var disable = false;
function getStudentList(){
	var studentList;
	var form = document.getElementById("webcat_Form_3");
	if(form){
		var parentNode = form.getElementsByTagName("tbody")[2];
		studentList = parentNode.getElementsByTagName("tr");
	}
	return studentList;
}
function removeStudents(){
	var studentList = getStudentList();
	clean(studentList);
}

function getStudentName(studentName){
	var re = / +\(.+\)/;
	var pureName = studentName.replace(re, '');
	return pureName;
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function autoCheckGrade(){
	if(autoShowGrade){
		var attempts = 0;
		var checkBox = $('input#done');
		while(checkBox.length == 0 && attempts ++ < 100){

			console.log('check');
			await timeout(30);
			checkBox = $('input#done');
		}
		var pressed = checkBox.attr('aria-pressed');
		if(!pressed)
			checkBox.click();
	}
}
async function async_refresh2(){
	var studentList = getStudentList();
	var old_name = studentList[0].innerText;
	var new_name = old_name;
	var attempts = 0;
	while(attempts ++ < 100){
		await timeout(30);
		studentList = getStudentList();
		new_name = studentList[0].innerText;
		if(old_name != new_name) 
			break;
	}
	console.log(old_name);
	console.log(new_name);
	await refreshStudents(studentList);
}
async function async_refresh(){
	await timeout(100);
	studentList = getStudentList();
	var attempts = 0;
	if(studentList){
		studentList = null;
	}
	while(!studentList && attempts ++ < 100){
		await timeout(30);
		studentList = getStudentList();
	}
	await refreshStudents(studentList);
}
async function refreshStudents(studentList){
	if(studentList){
		var td_student_dom, student_info, td_student_name;
		var tr;
		var lockClass = 'unlock';
		for (var i = 0, len = studentList.length; i < len; i++) {
			tr = studentList[i];
			student_info = tr.getElementsByTagName("td");
			if(student_info.length > 2) {
				td_student_dom = student_info[1];
				td_student_name = td_student_dom.innerText;
				if(lock) lockClass = 'locked';
				if(isStudentInSection(getStudentName(td_student_name)))
					td_student_dom.innerHTML = `<span class="inSection `+ lockClass + `">` + td_student_name + `</span>`;
				else
					if(autoFilter)
						tr.style.display = 'none';
					else {
						tr.style.display = 'table-row';
						td_student_dom.innerHTML = `<span class="outSection `+ lockClass + `">` + td_student_name + `</span>`;
					}
			}

		}
	}
}
function isStudentInSection(student_name){
		return studentInSection.has(student_name);
}
function handleStudent(student){
	if(!lock){
		var classAssigned = '';
		var name = student[0].innerText;
		var pureName = getStudentName(name);
		if( isStudentInSection(pureName) ){
			studentInSection.delete(pureName);
			classAssigned = 'outSection';
		} else{
			studentInSection.add(pureName);
			classAssigned = 'inSection'
		}
		chrome.storage.sync.set({
	    studentInSection: Array.from(studentInSection)
	  }, function() {
	  	student.removeClass('inSection').removeClass('outSection').addClass(classAssigned);
	  });
	}
}
$( document ).ready(function() {

	chrome.storage.sync.get({
		showUI: true,
		disable: false
		}, function(items){
			showUI = items.showUI;
			disable = items.disable;
			if(!disable){
				var title = document.title;
				if(title == "View Submissions"){
					pageType = 1;
				}
				if(title == "Grade One Submission")
					pageType = 2;
				if (pageType != 0 ){
					if(pageType == 1){
				  	$('html').prepend(`<div class="aiteBtn info"><input name="autoFilter" type="checkbox">AutoFilter   <input name="lock" type="checkbox">Lock</div>`);
						if(!showUI)
							$('.aiteBtn').hide();
						$( document ).on( "change", "input[name=autoFilter]", function() {
						  autoFilter = $(this).is(':checked');
							chrome.storage.sync.set({
						    autoFilter: autoFilter
						  }, function() {
						  	async_refresh();
						  });
						});
						$( document ).on( "change", "input[name=lock]", function() {
						  lock = $(this).is(':checked');
							chrome.storage.sync.set({
						    lock: lock
						  }, function() {
						  	async_refresh();
						  });
						});
				  	$( document ).on( "click", "span.inSection", function() {
						  handleStudent($(this));
						});
						$( document ).on( "click", "span.outSection", function() {
						  handleStudent($(this));
						});
						$( document ).on( "click", "a.active", function() {
						  async_refresh2();
						});
						$( document ).on( "click", "input.icon", function() {
						  async_refresh2();
						});
						$( document ).on( "change", "tbody", function() {
							console.log('hey');
						});
						$( document ).on( "change", "table", function() {
							async_refresh();
						});
						chrome.storage.sync.get({
							studentInSection: [],
							autoFilter: false,
							lock: false
							}, function(items){
								autoFilter = items.autoFilter;
								lock = items.lock;
								$('input[name=autoFilter]').prop('checked', autoFilter);
								$('input[name=lock]').prop('checked', lock);
								var temp = items.studentInSection;
								for ( var i = 0; i < temp.length; i++)
									studentInSection.add(temp[i]);
						  	async_refresh();

						});
				  } else if(pageType == 2) {
				  	$('html').prepend(`<div class="aiteBtn edit"><input name="autoShowGrade" type="checkbox">AutoShowGradeToStudent</div>`);
						if(!showUI)
							$('.aiteBtn').hide();
						$( document ).on( "change", "input[name=autoShowGrade]", function() {
						  autoShowGrade = $(this).is(':checked');
							chrome.storage.sync.set({
						    autoShowGrade: autoShowGrade
						  }, function() {
						  	autoCheckGrade();
						  });

						});
						chrome.storage.sync.get({
							autoShowGrade: false
							}, function(items){
								autoShowGrade = items.autoShowGrade;
								if(autoShowGrade){
									$('input[name=autoShowGrade]').prop('checked', true);
									autoCheckGrade();
								}
						});
				  }
				}
			}
	});
});