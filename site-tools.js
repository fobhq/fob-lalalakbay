(function () {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  const lifecycle = new AbortController();
  const register = tool => {
    try { Promise.resolve(context.registerTool(tool, {signal:lifecycle.signal})).catch(console.error); }
    catch (error) { console.error(error); }
  };
  register({
    name:'read_shuttle_options', title:'View LaLaLakbay shuttle options',
    description:'Read the same packages, pickup points, payment deadlines, and booking status displayed on this website.',
    inputSchema:{type:'object',properties:{},additionalProperties:false},
    annotations:{readOnlyHint:true,untrustedContentHint:false},
    execute(input) {
      if (!input || Object.keys(input).length) throw new Error('No input fields are accepted.');
      const c=window.FOB_CONFIG;
      return {campaign:c.campaignId,bookingOpen:c.bookingEnabled,date:'January 14, 2027',packages:c.packages,pickups:c.pickupPoints,pickupRules:c.pickupRules,deadlines:c.deadlines};
    }
  });
  register({
    name:'start_shuttle_planning', title:'Start planning a shuttle',
    description:'Open the visible trip planner with a selected vehicle and package. Does not reserve a seat, submit passenger data, or collect payment.',
    inputSchema:{type:'object',properties:{vehicle:{type:'string',enum:['bus','van']},packageId:{type:'string'}},required:['vehicle','packageId'],additionalProperties:false},
    annotations:{readOnlyHint:false,untrustedContentHint:false},
    execute(input) {
      const c=window.FOB_CONFIG;
      if (!input || Object.keys(input).some(k=>!['vehicle','packageId'].includes(k)) || !c.packages[input.vehicle]?.some(p=>p.id===input.packageId)) throw new Error('Choose a valid vehicle and package.');
      const url=new URL('booking.html',location.href);url.searchParams.set('vehicle',input.vehicle);url.searchParams.set('package',input.packageId);
      location.assign(url.href);
      return {opened:'trip_planner',vehicle:input.vehicle,packageId:input.packageId,bookingOpen:c.bookingEnabled};
    }
  });
  addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
})();
