let deals=[];
let dataUpdatedAt='';
const currency=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});
let active='All';
const template=document.querySelector('#deal-template');
const deck=document.querySelector('#deals');
const search=document.querySelector('#search');
const sortSelect=document.querySelector('#sort');

function discount(deal){return Math.round((1-deal.price/deal.was)*100)}
function savings(deal){return deal.was-deal.price}
function sorted(list){
  const copy=[...list];
  if(sortSelect.value==='discount')return copy.sort((a,b)=>discount(b)-discount(a));
  if(sortSelect.value==='savings')return copy.sort((a,b)=>savings(b)-savings(a));
  if(sortSelect.value==='price-low')return copy.sort((a,b)=>a.price-b.price);
  if(sortSelect.value==='price-high')return copy.sort((a,b)=>b.price-a.price);
  return copy.sort((a,b)=>(a.priority||999)-(b.priority||999));
}
function draw(){
  const query=search.value.toLowerCase();
  const filtered=deals.filter(deal=>{
    const matchesFilter=active==='All'||active===deal.category||(active==='Doorbusters'&&deal.condition.includes('Doorbuster'))||(active==='Refurbished'&&deal.condition.includes('Refurbished'));
    return matchesFilter&&`${deal.name} ${deal.retailer} ${deal.category}`.toLowerCase().includes(query);
  });
  const visible=sorted(filtered);
  deck.replaceChildren(...visible.map(deal=>{
    const node=template.content.cloneNode(true);
    const image=node.querySelector('.product-image');
    const fallback=node.querySelector('.image-fallback');
    image.src=deal.image;
    image.alt=`${deal.name} product photo`;
    image.addEventListener('error',()=>{image.hidden=true;fallback.hidden=false});
    node.querySelector('.tag').textContent=deal.condition;
    node.querySelector('.retailer').textContent=deal.retailer;
    node.querySelector('h2').textContent=deal.name;
    node.querySelector('.meta').textContent=deal.note;
    node.querySelector('.ends').textContent=deal.ends;
    const channelRow=node.querySelector('.availability');
    deal.channels.forEach(channel=>{const chip=document.createElement('span');const isOnline=channel==='Online';chip.textContent=channel;chip.className=isOnline?'availability-chip online':'availability-chip store';channelRow.append(chip)});
    node.querySelector('.price').textContent=currency.format(deal.price);
    node.querySelector('.was').textContent=currency.format(deal.was);
    node.querySelector('.percent').textContent=`${discount(deal)}% off`;
    node.querySelector('.saving').textContent=`YOU SAVE ${currency.format(savings(deal))}`;
    const comparison=node.querySelector('.comparison-note');
    comparison.textContent=deal.comparisonType==='retailer-reference'?'Retailer reference price—review the card note.':'Comparison price verified on the listed source.';
    comparison.classList.toggle('caution',deal.comparisonType==='retailer-reference');
    node.querySelector('.shop').href=deal.url;
    return node;
  }));
  document.querySelector('#count').textContent=visible.length;
  document.querySelector('#empty').hidden=visible.length!==0;
}
function buildFilters(){
  const preferred=['Apple','Headphones','Vacuums','TVs & Home','Monitors','Cameras','Clothing','Furniture'];
  const available=[...new Set(deals.map(deal=>deal.category))];
  const categories=preferred.filter(category=>available.includes(category)).concat(available.filter(category=>!preferred.includes(category)).sort());
  const filters=['All',...(deals.some(deal=>deal.condition.includes('Doorbuster'))?['Doorbusters']:[]),...categories,'Refurbished'];
  const filterBar=document.querySelector('#filters');
  filterBar.replaceChildren();
  filters.forEach(filter=>{const button=document.createElement('button');button.className=`chip ${filter==='All'?'active':''}`;button.textContent=filter;button.onclick=()=>{active=filter;document.querySelectorAll('.chip').forEach(chip=>chip.classList.toggle('active',chip.textContent===filter));draw()};filterBar.append(button)});
}
search.addEventListener('input',draw);
sortSelect.addEventListener('change',draw);
function showStoreAds(ads) {
  const today = new Intl.DateTimeFormat('en-CA', {timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date());
  const list = document.querySelector('#store-ads');
  for (const ad of ads.filter(ad => today <= ad.displayThrough)) {
    const row = document.createElement('li');
    const link = document.createElement('a');
    link.href = ad.url;
    link.textContent = ad.retailer;
    const description = document.createElement('p');
    description.textContent = ad.details;
    row.append(link, description);
    list.append(row);
  }
  document.querySelector('#ad-count').textContent = list.childElementCount === 1 ? '1 retailer' : list.childElementCount + ' retailers';
  document.querySelector('#doorbusters').hidden = !list.childElementCount;
}

async function loadDeals(){
  try{
    const response=await fetch(`deals.json?v=${Date.now()}`,{cache:'no-store'});
    if(!response.ok)throw new Error(`Deal data returned ${response.status}`);
    const payload=await response.json();
    if(!Array.isArray(payload.deals))throw new Error('Deal data is invalid');
    deals=payload.deals;
    dataUpdatedAt=payload.updatedAt;
    showStoreAds(payload.storeAds || []);
    buildFilters();
    const checked=new Date(dataUpdatedAt);
    document.querySelector('#checked').textContent=`Prices checked · ${checked.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`;
    draw();
  }catch(error){
    document.querySelector('#checked').textContent='Deal data temporarily unavailable';
    document.querySelector('#empty').hidden=false;
    document.querySelector('#empty').textContent='We could not load the latest verified deals. Please refresh shortly.';
  }
}
loadDeals();
