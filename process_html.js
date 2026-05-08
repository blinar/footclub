import fs from 'fs';
import path from 'path';

const pagesMap = {
  'maquettes/connexion/code.html': 'public/pages/login.html',
  'maquettes/cr_er_un_compte/code.html': 'public/pages/register.html',
  'maquettes/param_tres_changer_le_mot_de_passe_1/code.html': 'public/pages/settings.html',
  'maquettes/admin_quipes_1/code.html': 'public/pages/admin/teams.html',
  'maquettes/coach_calendrier/code.html': 'public/pages/coach/calendar.html',
  'maquettes/ajouter_un_v_nement_modal_1/code.html': 'public/pages/coach/add-event.html',
  'maquettes/ajouter_un_v_nement_modal_2/code.html': 'public/pages/coach/edit-event.html',
  'maquettes/coach_mon_quipe/code.html': 'public/pages/coach/team.html',
  'maquettes/utilisateur_calendrier/code.html': 'public/pages/user/calendar.html'
};

const actionMap = {
  'public/pages/login.html': '/auth/login',
  'public/pages/register.html': '/auth/register',
  'public/pages/settings.html': '/auth/change-password',
  'public/pages/admin/teams.html': '/admin/teams',
  'public/pages/coach/add-event.html': '/coach/events',
  'public/pages/coach/edit-event.html': '/coach/events/:id/update',
  'public/pages/coach/team.html': '/coach/team'
};

for (const [src, dest] of Object.entries(pagesMap)) {
  if (fs.existsSync(src)) {
    let content = fs.readFileSync(src, 'utf-8');
    
    // Strip tailwind & external scripts except fonts (if we want to keep fonts)
    content = content.replace(/<script src="https:\/\/cdn\.tailwindcss\.com.*?"[^>]*><\/script>/gi, '');
    content = content.replace(/<script id="tailwind-config"[\s\S]*?<\/script>/gi, '');
    
    // Add our stylesheet
    content = content.replace(/<\/head>/i, '  <link rel="stylesheet" href="/css/style.css">\n</head>');
    
    // Replace form tag properties
    if (actionMap[dest]) {
      content = content.replace(/<form[^>]*>/gi, (match) => {
        return `<form action="${actionMap[dest]}" method="POST" class="${match.match(/class="([^"]*)"/)?.[1] || ''}">`;
      });
    }
    
    fs.writeFileSync(dest, content);
    console.log(`Processed ${src} -> ${dest}`);
  } else {
    console.log(`Not found: ${src}`);
  }
}
