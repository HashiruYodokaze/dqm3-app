let monsters = [];
let synthesis = [];
let locations = [];
let seasons = [];
let weather = [];
let monsterEggTypes = [];
let eggTypes = [];
let monsterLocations = [];
let families = [];
let ranks = [];
let collected = JSON.parse(localStorage.getItem('dqm3_collected') || '[]');

const monsterListEl = document.getElementById('monsterList');
const searchInput = document.getElementById('searchInput');
const familyFilter = document.getElementById('familyFilter');
const rankFilter = document.getElementById('rankFilter');
const locationFilter = document.getElementById('locationFilter');
const methodFilter = document.getElementById('methodFilter');
const detailModal = document.getElementById('detailModal');
const modalContainer = document.getElementById('modalContainer');
const modalContent = document.getElementById('modalContent');

async function init() {
    try {
        const responses = await Promise.all([
            fetch('data/monsters.json'),
            fetch('data/synthesis.json'),
            fetch('data/location.json'),
            fetch('data/season.json'),
            fetch('data/weather.json'),
            fetch('data/monster_egg_type.json'),
            fetch('data/egg_type.json'),
            fetch('data/monster_location.json'),
            fetch('data/family.json'),
            fetch('data/rank.json')
        ]);

        [
            monsters, 
            synthesis, 
            locations, 
            seasons, 
            weather, 
            monsterEggTypes, 
            eggTypes,
            monsterLocations,
            families,
            ranks
        ] = await Promise.all(responses.map(res => res.json()));

        // Sort monsters by Number by default
        monsters.sort((a, b) => (a.Number || Infinity) - (b.Number || Infinity));
        families.sort((a, b) => a.FamilyId - b.FamilyId);
        ranks.sort((a, b) => a.RankId - b.RankId);
        locations.sort((a, b) => a.LocationId - b.LocationId);

        setupFilters();
        applyFilters();
    } catch (error) {
        console.error("Error loading data:", error);
        monsterListEl.innerHTML = `<div class="text-center py-10 text-red-500">Failed to load monster data.</div>`;
    }
}

function setupFilters() {
    // Families
    families.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.FamilyId;
        opt.textContent = f.Name;
        familyFilter.appendChild(opt);
    });

    // Ranks
    ranks.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.RankId;
        opt.textContent = r.Name;
        rankFilter.appendChild(opt);
    });

    // Locations
    locations.forEach(l => {
        const opt = document.createElement('option');
        opt.value = l.LocationId;
        opt.textContent = l.Name;
        locationFilter.appendChild(opt);
    });

    // Event Listeners for Filters
    [searchInput, familyFilter, rankFilter, locationFilter, methodFilter].forEach(el => {
        el.addEventListener('input', applyFilters);
    });
}

function applyFilters() {
    const term = searchInput.value.toLowerCase();
    const famId = familyFilter.value;
    const rankId = rankFilter.value;
    const locId = locationFilter.value;
    const method = methodFilter.value;

    const filtered = monsters.filter(m => {
        if (m.Number === null || m.MonsterId < 101) return false;

        // Search term
        if (term && !m.Name.toLowerCase().includes(term)) return false;

        // Family
        if (famId && m.FamilyId != famId) return false;

        // Rank
        if (rankId && m.RankId != rankId) return false;

        // Location
        if (locId) {
            const foundInLoc = monsterLocations.some(ml => ml.MonsterId === m.MonsterId && ml.LocationId == locId);
            if (!foundInLoc) return false;
        }

        // Obtain Method
        if (method) {
            if (method === 'scouting') {
                if (!monsterLocations.some(ml => ml.MonsterId === m.MonsterId)) return false;
            } else if (method === 'synthesis') {
                if (!synthesis.some(s => s.MonsterResultId === m.MonsterId)) return false;
            } else if (method === 'eggs') {
                if (!monsterEggTypes.some(me => me.MonsterId === m.MonsterId)) return false;
            }
        }

        return true;
    });

    renderList(filtered);
}

function renderList(list) {
    monsterListEl.innerHTML = '';
    
    list.forEach(monster => {
        const isCollected = collected.includes(monster.MonsterId);
        const card = document.createElement('div');
        card.className = `monster-card flex items-center p-3 bg-white rounded-xl shadow-sm border-l-4 ${isCollected ? 'border-green-500' : 'border-slate-300'} cursor-pointer w-full`;
        card.onclick = () => showDetail(monster.MonsterId);
        
        card.innerHTML = `
            <input type="checkbox" ${isCollected ? 'checked' : ''} 
                   class="w-5 h-5 mr-3 accent-indigo-600" 
                   onclick="toggleCollected(event, ${monster.MonsterId})">
            <img src="images/thumbs/${monster.Identifier}-thumb.png" 
                 onerror="this.src='https://via.placeholder.com/40?text=?'"
                 class="w-10 h-10 rounded-full bg-slate-100 mr-3 object-contain">
            <div class="flex-1">
                <div class="font-bold text-slate-800">${monster.Name}</div>
                <div class="text-xs text-slate-500">No. ${monster.Number} | ${getRankName(monster.RankId)}</div>
            </div>
            <div class="text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
            </div>
        `;
        monsterListEl.appendChild(card);
    });
}

function toggleCollected(event, id) {
    event.stopPropagation();
    if (collected.includes(id)) {
        collected = collected.filter(mId => mId !== id);
    } else {
        collected.push(id);
    }
    localStorage.setItem('dqm3_collected', JSON.stringify(collected));
    
    const card = event.target.closest('.monster-card');
    if (collected.includes(id)) {
        card.classList.replace('border-slate-300', 'border-green-500');
    } else {
        card.classList.replace('border-green-500', 'border-slate-300');
    }
}

function getMonsterName(mId) {
    const m = monsters.find(mon => mon.MonsterId === mId);
    return m ? m.Name : `Unknown (${mId})`;
}

function getLocationName(lId) {
    const l = locations.find(loc => loc.LocationId === lId);
    return l ? l.Name : `Unknown Loc (${lId})`;
}

function getSeasonName(sId) {
    const s = seasons.find(sea => sea.SeasonId === sId);
    return s ? s.Name : `Unknown Season (${sId})`;
}

function getWeatherName(wId) {
    const w = weather.find(wea => wea.WeatherId === wId);
    return w ? w.Name : `Unknown Weather (${wId})`;
}

function getEggTypeName(eId) {
    const e = eggTypes.find(eg => eg.EggTypeId === eId);
    return e ? e.Name : `Unknown Egg (${eId})`;
}

function getFamilyName(fId) {
    const f = families.find(fam => fam.FamilyId === fId);
    return f ? f.Name : `Unknown Family (${fId})`;
}

function getRankName(rId) {
    const r = ranks.find(rn => rn.RankId === rId);
    return r ? r.Name : `Rank ${rId}`;
}

async function showDetail(id) {
    const monster = monsters.find(m => m.MonsterId === id);
    if (!monster) return;

    const scoutLocs = monsterLocations.filter(loc => loc.MonsterId === id);
    const incoming = synthesis.filter(s => s.MonsterResultId === id);
    const eggTypesList = monsterEggTypes.filter(e => e.MonsterId === id);
    const outgoing = synthesis.filter(s => s.MonsterParent1Id === id || s.MonsterParent2Id === id);

    modalContent.innerHTML = `
        <div class="text-center mb-6">
            <img src="images/full/${monster.MonsterId}.${monster.Name.replace(/ /g, '_')}.1.jpg"
                 onerror="this.src='https://via.placeholder.com/150?text=No+Image'"
                 class="w-32 h-32 mx-auto mb-4 rounded-lg shadow-sm object-contain bg-slate-50">
            <h2 class="text-2xl font-bold text-indigo-600">${monster.Name}</h2>
            <p class="text-slate-500">No. ${monster.Number} | ${getRankName(monster.RankId)}</p>
            <p class="text-indigo-400 font-semibold text-sm">${getFamilyName(monster.FamilyId)}</p>
        </div>

        <div class="space-y-6">
            <section>
                <h3 class="font-bold text-slate-800 border-b pb-1 mb-2">Details</h3>
                <p class="text-sm text-slate-600 italic">${monster.Trivia || 'No trivia available.'}</p>
            </section>

            <section>
                <h3 class="font-bold text-slate-800 border-b pb-1 mb-2">How to Obtain</h3>
                <div class="space-y-4">
                    <div>
                        <span class="text-xs font-bold uppercase text-slate-400">Scouting</span>
                        <div class="space-y-1 mt-1">
                            ${scoutLocs.length > 0 
                                ? scoutLocs.map(loc => `
                                    <div class="text-sm text-slate-600">
                                        ${getLocationName(loc.LocationId)} 
                                        <span class="text-slate-400">(${getSeasonName(loc.SeasonId)}, ${getWeatherName(loc.WeatherId)})</span>
                                    </div>
                                `).join('') 
                                : '<p class="text-sm text-slate-400">Not obtainable via scouting.</p>'}
                        </div>
                    </div>
                    <div>
                        <span class="text-xs font-bold uppercase text-slate-400">Synthesis</span>
                        <div class="space-y-1 mt-1">
                            ${incoming.length > 0 
                                ? incoming.map(s => `
                                    <div class="text-sm text-slate-600">
                                        ${getMonsterName(s.MonsterParent1Id)} + ${getMonsterName(s.MonsterParent2Id)}
                                    </div>
                                `).join('') 
                                : '<p class="text-sm text-slate-400">No synthesis recipes.</p>'}
                        </div>
                    </div>
                    <div>
                        <span class="text-xs font-bold uppercase text-slate-400">Eggs</span>
                        <div class="space-y-1 mt-1">
                            ${eggTypesList.length > 0 
                                ? eggTypesList.map(e => `
                                    <div class="text-sm text-slate-600">${getEggTypeName(e.EggTypeId)}</div>
                                `).join('') 
                                : '<p class="text-sm text-slate-400">Not obtainable from eggs.</p>'}
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h3 class="font-bold text-slate-800 border-b pb-1 mb-2">Synthesis: What it can make</h3>
                <div class="space-y-2">
                    ${outgoing.length > 0 
                        ? outgoing.map(s => {
                            const partnerId = s.MonsterParent1Id === id ? s.MonsterParent2Id : s.MonsterParent1Id;
                            return `
                                <div class="text-sm bg-slate-50 p-2 rounded border">
                                    ${monster.Name} + ${getMonsterName(partnerId)} &rarr; <span class="font-bold">${getMonsterName(s.MonsterResultId)}</span>
                                </div>
                            `;
                        }).join('') 
                        : '<p class="text-sm text-slate-400">Does not participate in any known synthesis.</p>'}
                </div>
            </section>
        </div>
    `;

    detailModal.classList.remove('hidden');
    modalContainer.scrollTop = 0;
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    detailModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

init();
