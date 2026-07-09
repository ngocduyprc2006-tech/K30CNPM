(() => {
"use strict";
const ROOM_KEY = "room_manager_rooms_v2";
const BOOKING_KEY = "room_manager_bookings_v2";
const OPEN_MINUTES = 8 * 60;
const CLOSE_MINUTES = 18 * 60;
const SLOT_STEP = 30;

const viewMeta = {
  dashboard:["Tổng quan phòng họp","Theo dõi phòng, lịch đặt và tình trạng sử dụng."],
  rooms:["Danh sách phòng họp","Quản lý thông tin và tình trạng từng phòng."],
  history:["Lịch sử sử dụng phòng","Xem các lượt sử dụng phòng đã kết thúc."],
  bookings:["Lịch đặt phòng","Theo dõi và quản lý các khoảng thời gian đã đặt."],
  availability:["Thời gian trống","Tìm những khoảng thời gian phòng chưa được đặt."],
  settings:["Cài đặt","Quản lý dữ liệu lưu trên trình duyệt."]
};

const roomStatusMeta = {
  active:{label:"Hoạt động",cls:"active"},
  maintenance:{label:"Bảo trì",cls:"maintenance"},
  inactive:{label:"Ngừng sử dụng",cls:"inactive"}
};

const sampleRooms = [
  {id:"r1",name:"Phòng Horizon",code:"A-201",capacity:12,status:"active",location:"Tầng 2, khu A",equipment:"TV 65 inch, Camera hội nghị, Bảng trắng",description:"Phòng hiện đại dành cho nhóm dự án.",createdAt:"2026-06-10T08:00:00Z",updatedAt:"2026-06-28T09:20:00Z"},
  {id:"r2",name:"Phòng Innovation",code:"B-305",capacity:24,status:"active",location:"Tầng 3, khu B",equipment:"Máy chiếu 4K, Micro, Camera hội nghị",description:"Phòng lớn phù hợp cho thuyết trình.",createdAt:"2026-06-10T08:00:00Z",updatedAt:"2026-06-27T10:05:00Z"},
  {id:"r3",name:"Phòng Focus",code:"A-105",capacity:6,status:"active",location:"Tầng 1, khu A",equipment:"TV 43 inch, Bảng kính",description:"Không gian nhỏ và yên tĩnh.",createdAt:"2026-06-10T08:00:00Z",updatedAt:"2026-06-25T14:30:00Z"},
  {id:"r4",name:"Phòng Executive",code:"C-401",capacity:18,status:"maintenance",location:"Tầng 4, khu C",equipment:"TV 75 inch, Camera AI, Âm thanh",description:"Đang bảo trì hệ thống âm thanh.",createdAt:"2026-06-10T08:00:00Z",updatedAt:"2026-06-29T06:40:00Z"},
  {id:"r5",name:"Phòng Creative Lab",code:"B-210",capacity:10,status:"active",location:"Tầng 2, khu B",equipment:"Máy chiếu, Bảng trắng, Bàn linh hoạt",description:"Không gian sáng tạo linh hoạt.",createdAt:"2026-06-10T08:00:00Z",updatedAt:"2026-06-24T11:10:00Z"},
  {id:"r6",name:"Phòng Boardroom",code:"C-501",capacity:32,status:"inactive",location:"Tầng 5, khu C",equipment:"LED 86 inch, Camera 360°, Micro",description:"Tạm ngừng để nâng cấp nội thất.",createdAt:"2026-06-10T08:00:00Z",updatedAt:"2026-06-23T15:50:00Z"}
];

const today = new Date();
const todayStr = dateToInput(today);
const minus1 = addDays(today,-1);
const minus2 = addDays(today,-2);
const plus1 = addDays(today,1);
const plus2 = addDays(today,2);

const sampleBookings = [
  {id:"b1",roomId:"r1",date:dateToInput(minus2),start:"09:00",end:"10:00",status:"reserved",note:"Đã kiểm tra thiết bị",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},
  {id:"b2",roomId:"r3",date:dateToInput(minus1),start:"14:00",end:"15:30",status:"reserved",note:"Sử dụng bảng kính",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},
  {id:"b3",roomId:"r2",date:todayStr,start:"09:00",end:"10:30",status:"reserved",note:"",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},
  {id:"b4",roomId:"r5",date:todayStr,start:"13:00",end:"14:00",status:"reserved",note:"",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},
  {id:"b5",roomId:"r1",date:dateToInput(plus1),start:"10:00",end:"11:30",status:"reserved",note:"",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},
  {id:"b6",roomId:"r2",date:dateToInput(plus2),start:"15:00",end:"16:30",status:"reserved",note:"",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}
];

const state = {
  rooms:[],
  bookings:[],
  currentView:"dashboard",
  detailRoomId:"",
  confirmResolver:null
};

const dom = {};
document.addEventListener("DOMContentLoaded", init);

function init(){
  cacheDom();
  state.rooms = loadData(ROOM_KEY,sampleRooms).map(normalizeRoom);
  state.bookings = loadData(BOOKING_KEY,sampleBookings).map(normalizeBooking);
  bindEvents();
  dom.dateChip.textContent = new Intl.DateTimeFormat("vi-VN",{weekday:"long",day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date());
  dom.availabilityDate.value = todayStr;
  dom.bookingDate.value = todayStr;
  setDefaultHistoryDates();
  fillRoomSelects();
  renderAll();
  showView("dashboard");
}

function cacheDom(){
  const ids = ["sidebar","mobileMenu","pageTitle","pageSubtitle","dateChip","stats","dashboardRooms","recentBookings","dashboardAddRoom",
  "roomGrid","roomEmpty","roomSearch","roomStatusFilter","roomCapacityFilter","roomSort","addRoom","exportRooms",
  "historyRoom","historyFrom","historyTo","filterHistory","historyBody","exportHistory",
  "bookingRoomFilter","bookingDateFilter","bookingStatusFilter","filterBookings","clearBookingFilters","bookingBody","addBooking",
  "availabilityRoom","availabilityDate","availabilityDuration","checkAvailability","availabilityContent",
  "resetData","clearData","roomModal","roomModalTitle","closeRoomModal","roomForm","roomId","roomName","roomCode","roomCapacity","roomStatus","roomLocation","roomEquipment","roomDescription","roomNameError","roomCodeError","roomCapacityError","roomLocationError","cancelRoom","saveRoom",
  "bookingModal","bookingModalTitle","closeBookingModal","bookingForm","bookingId","bookingRoom","bookingDate","bookingStatus","bookingStart","bookingEnd","bookingNote","bookingRoomError","bookingDateError","bookingStartError","bookingEndError","conflictBox","cancelBooking","saveBooking",
  "detailModal","detailTitle","detailBody","closeDetailModal","closeDetail","editFromDetail",
  "confirmDialog","confirmTitle","confirmMessage","confirmCancel","confirmAccept","toast"];
  ids.forEach(id=>dom[id]=document.getElementById(id));
  dom.navItems=[...document.querySelectorAll(".nav-item[data-view]")];
  dom.views=[...document.querySelectorAll(".view")];
}

function bindEvents(){
  dom.navItems.forEach(btn=>btn.addEventListener("click",()=>showView(btn.dataset.view)));
  dom.mobileMenu.addEventListener("click",()=>dom.sidebar.classList.toggle("open"));
  dom.dashboardAddRoom.addEventListener("click",()=>openRoomModal());
  dom.addRoom.addEventListener("click",()=>openRoomModal());
  dom.exportRooms.addEventListener("click",exportRoomsCsv);

  [dom.roomSearch,dom.roomStatusFilter,dom.roomCapacityFilter,dom.roomSort].forEach(el=>{
    el.addEventListener("input",renderRoomsPage);
    el.addEventListener("change",renderRoomsPage);
  });

  dom.closeRoomModal.addEventListener("click",closeRoomModal);
  dom.cancelRoom.addEventListener("click",closeRoomModal);
  dom.saveRoom.addEventListener("click",()=>dom.roomForm.requestSubmit());
  dom.roomForm.addEventListener("submit",saveRoom);

  dom.addBooking.addEventListener("click",()=>openBookingModal());
  dom.closeBookingModal.addEventListener("click",closeBookingModal);
  dom.cancelBooking.addEventListener("click",closeBookingModal);
  dom.saveBooking.addEventListener("click",()=>dom.bookingForm.requestSubmit());
  dom.bookingForm.addEventListener("submit",saveBooking);

  dom.filterHistory.addEventListener("click",renderHistory);
  dom.exportHistory.addEventListener("click",exportHistoryCsv);
  dom.filterBookings.addEventListener("click",renderBookings);
  dom.clearBookingFilters.addEventListener("click",()=>{
    dom.bookingRoomFilter.value="";
    dom.bookingDateFilter.value="";
    dom.bookingStatusFilter.value="";
    renderBookings();
  });

  dom.checkAvailability.addEventListener("click",renderAvailability);
  dom.closeDetailModal.addEventListener("click",closeDetailModal);
  dom.closeDetail.addEventListener("click",closeDetailModal);
  dom.editFromDetail.addEventListener("click",editFromDetail);

  dom.resetData.addEventListener("click",resetData);
  dom.clearData.addEventListener("click",clearData);

  dom.confirmCancel.addEventListener("click",()=>resolveConfirm(false));
  dom.confirmAccept.addEventListener("click",()=>resolveConfirm(true));

  document.addEventListener("click",handleAction);
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"){
      closeRoomModal(); closeBookingModal(); closeDetailModal();
      if(dom.confirmDialog.classList.contains("show")) resolveConfirm(false);
    }
  });

  [dom.roomModal,dom.bookingModal,dom.detailModal].forEach(modal=>{
    modal.addEventListener("click",e=>{ if(e.target===modal) modal.classList.remove("show"); });
  });
}

function handleAction(e){
  const btn=e.target.closest("[data-action]");
  if(!btn)return;
  const {action,roomId,bookingId}=btn.dataset;
  if(action==="view-room")openDetailModal(roomId);
  if(action==="edit-room")openRoomModal(roomId);
  if(action==="delete-room")deleteRoom(roomId);
  if(action==="edit-booking")openBookingModal(bookingId);
  if(action==="cancel-booking")cancelBooking(bookingId);
  if(action==="delete-booking")deleteBooking(bookingId);
  if(action==="book-slot"){
    openBookingModal("",{roomId:btn.dataset.roomId,date:btn.dataset.date,start:btn.dataset.start,end:btn.dataset.end});
  }
}

function showView(name){
  if(!viewMeta[name])return;
  state.currentView=name;
  dom.views.forEach(v=>v.classList.toggle("active",v.id===`${name}View`));
  dom.navItems.forEach(b=>b.classList.toggle("active",b.dataset.view===name));
  dom.pageTitle.textContent=viewMeta[name][0];
  dom.pageSubtitle.textContent=viewMeta[name][1];
  dom.sidebar.classList.remove("open");
  if(name==="dashboard")renderDashboard();
  if(name==="rooms")renderRoomsPage();
  if(name==="history")renderHistory();
  if(name==="bookings")renderBookings();
  if(name==="availability")renderAvailability();
}

function renderAll(){
  fillRoomSelects();
  renderDashboard();
  renderRoomsPage();
  renderHistory();
  renderBookings();
  renderAvailability();
}

function renderDashboard(){
  const now=new Date();
  const active=state.rooms.filter(r=>r.status==="active").length;
  const maintenance=state.rooms.filter(r=>r.status==="maintenance").length;
  const todayBookings=state.bookings.filter(b=>b.date===todayStr && b.status!=="cancelled").length;
  const inUse=state.bookings.filter(b=>bookingComputedStatus(b,now)==="in-use").length;
  const cards=[
    ["Tổng số phòng",state.rooms.length,"Đang quản lý","▦","#4f46e5"],
    ["Phòng hoạt động",active,"Sẵn sàng sử dụng","✓","#10b981"],
    ["Đang bảo trì",maintenance,"Tạm thời chưa sử dụng","⚠","#f59e0b"],
    ["Lịch đặt hôm nay",todayBookings,`${inUse} phòng đang sử dụng`,"◷","#7c3aed"]
  ];
  dom.stats.innerHTML=cards.map(c=>`<article class="stat" style="--accent:${c[5]}"><div class="stat-icon">${c[3]}</div><div class="stat-label">${c[0]}</div><div class="stat-value">${c[1]}</div><div class="stat-note">${c[2]}</div></article>`).join("");

  dom.dashboardRooms.innerHTML=sortRooms(state.rooms,"updated-desc").slice(0,6).map(r=>roomCard(r,true)).join("") || `<div class="empty">Chưa có phòng.</div>`;

  const upcoming=state.bookings
    .filter(b=>b.status!=="cancelled" && endDateTime(b)>=now)
    .sort((a,b)=>startDateTime(a)-startDateTime(b))
    .slice(0,7);
  dom.recentBookings.innerHTML=upcoming.length?upcoming.map(b=>{
    const room=findRoom(b.roomId);
    return `<article class="recent-item"><div class="recent-icon">▤</div><div><strong>${escapeHtml(room?.name||"Phòng đã xóa")}</strong><span>${formatDate(b.date)} · ${b.start}–${b.end}</span></div></article>`;
  }).join(""):`<div class="empty">Chưa có lịch đặt sắp tới.</div>`;
}

function renderRoomsPage(){
  const q=dom.roomSearch.value.trim().toLowerCase();
  const sf=dom.roomStatusFilter.value;
  const cf=dom.roomCapacityFilter.value;
  let rooms=state.rooms.filter(r=>{
    const txt=[r.name,r.code,r.location,r.equipment,r.description].join(" ").toLowerCase();
    const cap=!cf || (cf==="small"&&r.capacity<10)||(cf==="medium"&&r.capacity>=10&&r.capacity<=20)||(cf==="large"&&r.capacity>20);
    return (!q||txt.includes(q))&&(!sf||r.status===sf)&&cap;
  });
  rooms=sortRooms(rooms,dom.roomSort.value);
  dom.roomGrid.innerHTML=rooms.map(r=>roomCard(r,false)).join("");
  dom.roomEmpty.classList.toggle("hidden",rooms.length>0);
}

function roomCard(r,compact){
  const s=roomStatusMeta[r.status];
  return `<article class="room-card">
    <div class="room-top"><div><h3>${escapeHtml(r.name)}</h3><div class="room-code">${escapeHtml(r.code)}</div></div><span class="badge ${s.cls}">${s.label}</span></div>
    <p class="room-desc">${escapeHtml(r.description||"Chưa có mô tả.")}</p>
    <div class="room-meta"><div class="meta">👥 ${r.capacity} người</div><div class="meta">🖥 ${escapeHtml((r.equipment||"Chưa cập nhật").split(",")[0])}</div></div>
    <div class="location">📍 ${escapeHtml(r.location)}</div>
    <div class="updated">Cập nhật: ${formatDateTime(r.updatedAt)}</div>
    <div class="room-actions">
      <button class="btn secondary" data-action="view-room" data-room-id="${r.id}">Chi tiết</button>
      ${compact?"":`<button class="btn ghost" data-action="edit-room" data-room-id="${r.id}">Chỉnh sửa</button><button class="btn danger-light" data-action="delete-room" data-room-id="${r.id}">Xóa</button>`}
    </div>
  </article>`;
}

function renderHistory(){
  const roomId=dom.historyRoom.value;
  const from=dom.historyFrom.value;
  const to=dom.historyTo.value;
  if(from&&to&&from>to){
    dom.historyBody.innerHTML=`<tr><td colspan="6" class="empty">Ngày bắt đầu không được lớn hơn ngày kết thúc.</td></tr>`;
    return;
  }
  const now=new Date();
  const rows=state.bookings.filter(b=>{
    if(b.status==="cancelled")return false;
    if(endDateTime(b)>=now)return false;
    return (!roomId||b.roomId===roomId)&&(!from||b.date>=from)&&(!to||b.date<=to);
  }).sort((a,b)=>startDateTime(b)-startDateTime(a));

  dom.historyBody.innerHTML=rows.length?rows.map(b=>{
    const room=findRoom(b.roomId);
    return `<tr><td>${formatDate(b.date)}</td><td><strong>${escapeHtml(room?.name||"Phòng đã xóa")}</strong></td><td>${b.start}–${b.end}</td><td>${durationText(b.start,b.end)}</td><td><span class="badge completed">Đã sử dụng</span></td><td>${escapeHtml(b.note||"—")}</td></tr>`;
  }).join(""):`<tr><td colspan="6" class="empty">Không có dữ liệu phù hợp.</td></tr>`;
}

function renderBookings(){
  const roomId=dom.bookingRoomFilter.value;
  const date=dom.bookingDateFilter.value;
  const status=dom.bookingStatusFilter.value;
  const now=new Date();
  const rows=state.bookings.filter(b=>{
    const computed=bookingComputedStatus(b,now);
    return (!roomId||b.roomId===roomId)&&(!date||b.date===date)&&(!status||computed===status);
  }).sort((a,b)=>startDateTime(a)-startDateTime(b));

  dom.bookingBody.innerHTML=rows.length?rows.map(b=>{
    const room=findRoom(b.roomId);
    const st=bookingComputedStatus(b,now);
    const meta={upcoming:"Sắp sử dụng","in-use":"Đang sử dụng",completed:"Đã sử dụng",cancelled:"Đã hủy"}[st];
    const canEdit=st==="upcoming";
    return `<tr>
      <td>${formatDate(b.date)}</td>
      <td><strong>${escapeHtml(room?.name||"Phòng đã xóa")}</strong><br><small>${escapeHtml(room?.code||"")}</small></td>
      <td>${b.start}–${b.end}</td>
      <td><span class="badge ${st}">${meta}</span></td>
      <td>${escapeHtml(b.note||"—")}</td>
      <td><div class="table-actions">
        ${canEdit?`<button class="btn secondary" data-action="edit-booking" data-booking-id="${b.id}">Sửa</button><button class="btn danger-light" data-action="cancel-booking" data-booking-id="${b.id}">Hủy</button>`:""}
        <button class="btn ghost" data-action="delete-booking" data-booking-id="${b.id}">Xóa</button>
      </div></td>
    </tr>`;
  }).join(""):`<tr><td colspan="6" class="empty">Không có lịch đặt phù hợp.</td></tr>`;
}

function renderAvailability(){
  const roomId=dom.availabilityRoom.value;
  const date=dom.availabilityDate.value||todayStr;
  const duration=Number(dom.availabilityDuration.value||60);
  const room=findRoom(roomId);
  if(!room){dom.availabilityContent.innerHTML=`<div class="empty">Chưa có phòng để kiểm tra.</div>`;return}
  if(room.status!=="active"){dom.availabilityContent.innerHTML=`<div class="no-slots"><strong>${escapeHtml(room.name)}</strong> hiện ở trạng thái ${roomStatusMeta[room.status].label.toLowerCase()}.</div>`;return}

  const slots=findAvailableSlots(roomId,date,duration);
  dom.availabilityContent.innerHTML=`
    <div class="availability-summary"><h3>${escapeHtml(room.name)} (${escapeHtml(room.code)})</h3><p>${formatDate(date)} · Thời lượng ${duration} phút · Giờ hoạt động 08:00–18:00</p></div>
    <div class="slot-title"><h3>Khoảng thời gian còn trống</h3><span>${slots.length} lựa chọn</span></div>
    ${slots.length?`<div class="slots">${slots.map(s=>`<button class="slot" data-action="book-slot" data-room-id="${roomId}" data-date="${date}" data-start="${s.start}" data-end="${s.end}">${s.start}–${s.end}</button>`).join("")}</div>`:`<div class="no-slots">Không còn khung giờ phù hợp trong ngày này.</div>`}`;
}

function findAvailableSlots(roomId,date,duration){
  const booked=state.bookings.filter(b=>b.roomId===roomId&&b.date===date&&b.status!=="cancelled")
    .map(b=>({start:timeToMinutes(b.start),end:timeToMinutes(b.end)}));
  const result=[];
  for(let start=OPEN_MINUTES;start+duration<=CLOSE_MINUTES;start+=SLOT_STEP){
    const end=start+duration;
    const overlap=booked.some(x=>start<x.end&&end>x.start);
    if(!overlap)result.push({start:minutesToTime(start),end:minutesToTime(end)});
  }
  return result;
}

function fillRoomSelects(){
  const options=state.rooms.map(r=>`<option value="${r.id}">${escapeHtml(r.name)} (${escapeHtml(r.code)})</option>`).join("");
  const all=`<option value="">Tất cả phòng</option>`;
  [dom.historyRoom,dom.bookingRoomFilter].forEach(sel=>{
    const old=sel.value; sel.innerHTML=all+options; if([...sel.options].some(o=>o.value===old))sel.value=old;
  });
  [dom.availabilityRoom,dom.bookingRoom].forEach(sel=>{
    const old=sel.value; sel.innerHTML=options; if([...sel.options].some(o=>o.value===old))sel.value=old;
  });
}

function openRoomModal(id=""){
  clearRoomErrors(); dom.roomForm.reset(); dom.roomId.value=""; dom.roomStatus.value="active"; dom.roomModalTitle.textContent="Thêm phòng mới";
  if(id){
    const r=findRoom(id); if(!r)return;
    dom.roomModalTitle.textContent="Cập nhật thông tin phòng";
    dom.roomId.value=r.id; dom.roomName.value=r.name; dom.roomCode.value=r.code; dom.roomCapacity.value=r.capacity; dom.roomStatus.value=r.status;
    dom.roomLocation.value=r.location; dom.roomEquipment.value=r.equipment; dom.roomDescription.value=r.description;
  }
  dom.roomModal.classList.add("show");
}
function closeRoomModal(){dom.roomModal.classList.remove("show")}
function saveRoom(e){
  e.preventDefault(); clearRoomErrors();
  const id=dom.roomId.value,name=dom.roomName.value.trim(),code=dom.roomCode.value.trim().toUpperCase(),capacity=Number(dom.roomCapacity.value),
  status=dom.roomStatus.value,location=dom.roomLocation.value.trim(),equipment=dom.roomEquipment.value.trim(),description=dom.roomDescription.value.trim();
  let ok=true;
  if(name.length<3){dom.roomNameError.textContent="Tên phòng phải có ít nhất 3 ký tự.";ok=false}
  if(!/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(code)){dom.roomCodeError.textContent="Mã phòng không hợp lệ.";ok=false}
  if(state.rooms.some(r=>r.code===code&&r.id!==id)){dom.roomCodeError.textContent="Mã phòng đã tồn tại.";ok=false}
  if(!Number.isInteger(capacity)||capacity<1||capacity>200){dom.roomCapacityError.textContent="Sức chứa từ 1 đến 200.";ok=false}
  if(location.length<3){dom.roomLocationError.textContent="Vị trí phải có ít nhất 3 ký tự.";ok=false}
  if(!ok)return;
  const now=new Date().toISOString();
  if(id){Object.assign(findRoom(id),{name,code,capacity,status,location,equipment,description,updatedAt:now});showToast("Cập nhật phòng thành công.","success")}
  else{state.rooms.unshift({id:createId(),name,code,capacity,status,location,equipment,description,createdAt:now,updatedAt:now});showToast("Thêm phòng thành công.","success")}
  saveAll(); closeRoomModal(); renderAll();
}
function clearRoomErrors(){[dom.roomNameError,dom.roomCodeError,dom.roomCapacityError,dom.roomLocationError].forEach(x=>x.textContent="")}

function openBookingModal(id="",preset=null){
  clearBookingErrors(); dom.bookingForm.reset(); dom.bookingId.value=""; dom.bookingStatus.value="reserved"; dom.bookingDate.value=todayStr; dom.bookingModalTitle.textContent="Đặt phòng";
  fillRoomSelects();
  if(id){
    const b=findBooking(id); if(!b)return;
    dom.bookingModalTitle.textContent="Cập nhật lịch đặt";
    dom.bookingId.value=b.id; dom.bookingRoom.value=b.roomId; dom.bookingDate.value=b.date; dom.bookingStart.value=b.start; dom.bookingEnd.value=b.end; dom.bookingStatus.value=b.status; dom.bookingNote.value=b.note;
  } else if(preset){
    dom.bookingRoom.value=preset.roomId||""; dom.bookingDate.value=preset.date||todayStr; dom.bookingStart.value=preset.start||""; dom.bookingEnd.value=preset.end||"";
  }
  dom.bookingModal.classList.add("show");
}
function closeBookingModal(){dom.bookingModal.classList.remove("show")}
function saveBooking(e){
  e.preventDefault(); clearBookingErrors();
  const id=dom.bookingId.value,roomId=dom.bookingRoom.value,date=dom.bookingDate.value,start=dom.bookingStart.value,end=dom.bookingEnd.value,status=dom.bookingStatus.value,note=dom.bookingNote.value.trim();
  let ok=true; const room=findRoom(roomId);
  if(!room){dom.bookingRoomError.textContent="Vui lòng chọn phòng.";ok=false}
  else if(room.status!=="active"&&status!=="cancelled"){dom.bookingRoomError.textContent="Phòng này chưa ở trạng thái hoạt động.";ok=false}
  if(!date){dom.bookingDateError.textContent="Vui lòng chọn ngày.";ok=false}
  if(!start){dom.bookingStartError.textContent="Vui lòng chọn giờ bắt đầu.";ok=false}
  if(!end){dom.bookingEndError.textContent="Vui lòng chọn giờ kết thúc.";ok=false}
  if(start&&end&&timeToMinutes(start)>=timeToMinutes(end)){dom.bookingEndError.textContent="Giờ kết thúc phải sau giờ bắt đầu.";ok=false}
  if(start&&end&&(timeToMinutes(start)<OPEN_MINUTES||timeToMinutes(end)>CLOSE_MINUTES)){dom.bookingEndError.textContent="Giờ sử dụng phải trong khoảng 08:00–18:00.";ok=false}
  const conflict=state.bookings.find(b=>b.id!==id&&b.roomId===roomId&&b.date===date&&b.status!=="cancelled"&&status!=="cancelled"&&timeToMinutes(start)<timeToMinutes(b.end)&&timeToMinutes(end)>timeToMinutes(b.start));
  if(conflict){dom.conflictBox.textContent=`Bị trùng với lịch ${conflict.start}–${conflict.end}.`;dom.conflictBox.classList.remove("hidden");ok=false}
  if(!ok)return;
  const now=new Date().toISOString();
  if(id){Object.assign(findBooking(id),{roomId,date,start,end,status,note,updatedAt:now});showToast("Cập nhật lịch đặt thành công.","success")}
  else{state.bookings.push({id:createId(),roomId,date,start,end,status,note,createdAt:now,updatedAt:now});showToast("Đặt phòng thành công.","success")}
  saveAll(); closeBookingModal(); renderAll();
}
function clearBookingErrors(){
  [dom.bookingRoomError,dom.bookingDateError,dom.bookingStartError,dom.bookingEndError].forEach(x=>x.textContent="");
  dom.conflictBox.textContent=""; dom.conflictBox.classList.add("hidden");
}

function openDetailModal(roomId){
  const r=findRoom(roomId); if(!r)return;
  state.detailRoomId=r.id; const s=roomStatusMeta[r.status];
  const bookings=state.bookings.filter(b=>b.roomId===r.id&&b.status!=="cancelled").sort((a,b)=>startDateTime(b)-startDateTime(a)).slice(0,5);
  dom.detailTitle.textContent=r.name;
  dom.detailBody.innerHTML=`<div class="detail-body">
    <div class="detail-hero"><h3>${escapeHtml(r.name)}</h3><p>${escapeHtml(r.code)} · ${escapeHtml(r.location)}</p></div>
    <div class="detail-grid">
      <div class="detail-item"><span>Trạng thái</span><strong><span class="badge ${s.cls}">${s.label}</span></strong></div>
      <div class="detail-item"><span>Sức chứa</span><strong>${r.capacity} người</strong></div>
      <div class="detail-item full"><span>Thiết bị</span><strong>${escapeHtml(r.equipment||"Chưa cập nhật")}</strong></div>
      <div class="detail-item full"><span>Mô tả</span><strong>${escapeHtml(r.description||"Chưa có mô tả")}</strong></div>
    </div>
  </div>
  <div class="detail-bookings"><h3>Lịch đặt gần đây</h3>
    ${bookings.length?`<div class="table-wrap" style="padding:0"><table><tbody>${bookings.map(b=>`<tr><td>${formatDate(b.date)}</td><td>${b.start}–${b.end}</td><td><span class="badge ${bookingComputedStatus(b,new Date())}">${statusLabel(bookingComputedStatus(b,new Date()))}</span></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">Chưa có lịch đặt.</div>`}
  </div>`;
  dom.detailModal.classList.add("show");
}
function closeDetailModal(){dom.detailModal.classList.remove("show");state.detailRoomId=""}
function editFromDetail(){const id=state.detailRoomId;closeDetailModal();if(id)openRoomModal(id)}

async function deleteRoom(id){
  const r=findRoom(id);if(!r)return;
  if(state.bookings.some(b=>b.roomId===id)){showToast("Không thể xóa phòng đã có lịch đặt hoặc lịch sử sử dụng.","error");return}
  if(await askConfirm("Xóa phòng",`Bạn có chắc muốn xóa “${r.name}” không?`)){state.rooms=state.rooms.filter(x=>x.id!==id);saveAll();renderAll();showToast("Đã xóa phòng.","success")}
}
async function cancelBooking(id){
  const b=findBooking(id);if(!b)return;
  if(await askConfirm("Hủy lịch đặt","Bạn có chắc muốn hủy khoảng thời gian này không?")){b.status="cancelled";b.updatedAt=new Date().toISOString();saveAll();renderAll();showToast("Đã hủy lịch đặt.","success")}
}
async function deleteBooking(id){
  if(await askConfirm("Xóa lịch đặt","Xóa vĩnh viễn dữ liệu lịch đặt này?")){state.bookings=state.bookings.filter(b=>b.id!==id);saveAll();renderAll();showToast("Đã xóa dữ liệu lịch đặt.","success")}
}

function bookingComputedStatus(b,now=new Date()){
  if(b.status==="cancelled")return "cancelled";
  const start=startDateTime(b),end=endDateTime(b);
  if(now<start)return "upcoming";
  if(now>=start&&now<end)return "in-use";
  return "completed";
}
function statusLabel(s){return {upcoming:"Sắp sử dụng","in-use":"Đang sử dụng",completed:"Đã sử dụng",cancelled:"Đã hủy"}[s]||s}

function setDefaultHistoryDates(){
  const d1=addDays(new Date(),-30),d2=new Date();
  dom.historyFrom.value=dateToInput(d1);dom.historyTo.value=dateToInput(d2);
}

function sortRooms(list,sort){
  const a=[...list];
  if(sort==="name-asc")return a.sort((x,y)=>x.name.localeCompare(y.name,"vi"));
  if(sort==="capacity-desc")return a.sort((x,y)=>y.capacity-x.capacity);
  if(sort==="capacity-asc")return a.sort((x,y)=>x.capacity-y.capacity);
  return a.sort((x,y)=>new Date(y.updatedAt)-new Date(x.updatedAt));
}

function exportRoomsCsv(){
  const rows=[["Tên phòng","Mã phòng","Sức chứa","Trạng thái","Vị trí","Thiết bị","Mô tả"],...state.rooms.map(r=>[r.name,r.code,r.capacity,roomStatusMeta[r.status].label,r.location,r.equipment,r.description])];
  downloadCsv(rows,"danh-sach-phong.csv");
}
function exportHistoryCsv(){
  const now=new Date();
  const rows=[["Ngày","Phòng","Mã phòng","Bắt đầu","Kết thúc","Thời lượng","Ghi chú"],...state.bookings.filter(b=>b.status!=="cancelled"&&endDateTime(b)<now).map(b=>{const r=findRoom(b.roomId);return [formatDate(b.date),r?.name||"Phòng đã xóa",r?.code||"",b.start,b.end,durationText(b.start,b.end),b.note]})];
  downloadCsv(rows,"lich-su-su-dung-phong.csv");
}
function downloadCsv(rows,name){
  const csv="\uFEFF"+rows.map(r=>r.map(csvEscape).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
}

async function resetData(){
  if(await askConfirm("Khôi phục dữ liệu mẫu","Dữ liệu hiện tại sẽ bị thay thế.")){state.rooms=clone(sampleRooms).map(normalizeRoom);state.bookings=clone(sampleBookings).map(normalizeBooking);saveAll();setDefaultHistoryDates();renderAll();showToast("Đã khôi phục dữ liệu mẫu.","success")}
}
async function clearData(){
  if(await askConfirm("Xóa toàn bộ dữ liệu","Tất cả phòng và lịch đặt sẽ bị xóa.")){state.rooms=[];state.bookings=[];saveAll();renderAll();showToast("Đã xóa toàn bộ dữ liệu.","success")}
}

function askConfirm(title,msg){
  dom.confirmTitle.textContent=title;dom.confirmMessage.textContent=msg;dom.confirmDialog.classList.add("show");
  return new Promise(resolve=>state.confirmResolver=resolve);
}
function resolveConfirm(v){if(state.confirmResolver)state.confirmResolver(v);state.confirmResolver=null;dom.confirmDialog.classList.remove("show")}

function saveAll(){localStorage.setItem(ROOM_KEY,JSON.stringify(state.rooms));localStorage.setItem(BOOKING_KEY,JSON.stringify(state.bookings))}
function loadData(key,fallback){try{const x=JSON.parse(localStorage.getItem(key));return Array.isArray(x)?x:clone(fallback)}catch{return clone(fallback)}}
function normalizeRoom(r){const now=new Date().toISOString();return {...r,id:String(r.id),capacity:Number(r.capacity)||1,status:roomStatusMeta[r.status]?r.status:"active",createdAt:r.createdAt||now,updatedAt:r.updatedAt||now}}
function normalizeBooking(b){const now=new Date().toISOString();return {...b,id:String(b.id),roomId:String(b.roomId),status:b.status==="cancelled"?"cancelled":"reserved",createdAt:b.createdAt||now,updatedAt:b.updatedAt||now,note:b.note||""}}
function findRoom(id){return state.rooms.find(r=>r.id===String(id))}
function findBooking(id){return state.bookings.find(b=>b.id===String(id))}
function createId(){return crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(16).slice(2)}`}
function clone(x){return JSON.parse(JSON.stringify(x))}
function timeToMinutes(t){const [h,m]=t.split(":").map(Number);return h*60+m}
function minutesToTime(m){return `${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`}
function startDateTime(b){return new Date(`${b.date}T${b.start}:00`)}
function endDateTime(b){return new Date(`${b.date}T${b.end}:00`)}
function durationText(start,end){const m=timeToMinutes(end)-timeToMinutes(start);return m%60?`${Math.floor(m/60)} giờ ${m%60} phút`:`${m/60} giờ`}
function dateToInput(d){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${day}`}
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
function formatDate(s){if(!s)return"";const [y,m,d]=s.split("-");return `${d}/${m}/${y}`}
function formatDateTime(v){const d=new Date(v);return Number.isNaN(d)?v:new Intl.DateTimeFormat("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(d)}
function csvEscape(v){const s=String(v??"");return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function showToast(msg,type="success"){dom.toast.textContent=msg;dom.toast.className=`toast ${type} show`;clearTimeout(showToast.t);showToast.t=setTimeout(()=>dom.toast.classList.remove("show"),2600)}
})();
