'use client';

import React from 'react';

export default function StoryViewer() {
  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-[#111813] dark:text-white antialiased min-h-screen">
      <div className="flex h-screen overflow-hidden">
        {/* Main Sidebar */}
        <aside className="w-72 bg-white dark:bg-zinc-900 border-r border-[#dbe6de] dark:border-zinc-800 flex flex-col justify-between p-6">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col px-2">
              <h1 className="text-[#111813] dark:text-white text-xl font-bold leading-normal flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-3xl">child_care</span>
                Pequenos Discípulos
              </h1>
              <p className="text-[#61896b] dark:text-zinc-400 text-sm font-normal">Educação Bíblica Infantil</p>
            </div>
            <nav className="flex flex-col gap-2">
              <a className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" href="#">
                <span className="material-symbols-outlined">home</span>
                <span className="font-semibold text-sm">Home</span>
              </a>
              <a className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-[#111813] dark:text-white transition-colors" href="#">
                <span className="material-symbols-outlined">library_books</span>
                <span className="font-semibold text-sm">Biblioteca</span>
              </a>
              <a className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" href="#">
                <span className="material-symbols-outlined">favorite</span>
                <span className="font-semibold text-sm">Favoritos</span>
              </a>
              <a className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" href="#">
                <span className="material-symbols-outlined">settings</span>
                <span className="font-semibold text-sm">Configurações</span>
              </a>
            </nav>
          </div>
          <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
            <p className="text-xs font-bold text-[#111813] dark:text-zinc-200 uppercase tracking-wider mb-2">Plano Premium</p>
            <p className="text-xs text-[#61896b] dark:text-zinc-400 mb-3">Crie histórias ilimitadas com IA para seus pequenos.</p>
            <button className="w-full py-2 bg-primary text-[#111813] font-bold text-xs rounded-lg hover:brightness-95 transition-all">Ver Detalhes</button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-8">
          <div className="max-w-6xl mx-auto h-full flex flex-col">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-[#dbe6de] dark:border-zinc-800 flex flex-col overflow-hidden flex-1">
              {/* Story Header */}
              <div className="px-8 py-6 border-b border-[#dbe6de] dark:border-zinc-800 flex items-center justify-between bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-6">
                  <button className="flex items-center gap-2 text-[#61896b] hover:text-[#111813] dark:text-zinc-400 dark:hover:text-white transition-colors font-semibold">
                    <span className="material-symbols-outlined">arrow_back</span>
                    Voltar
                  </button>
                  <h2 className="text-2xl font-black text-[#111813] dark:text-white">A Estrela de Mateus</h2>
                </div>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 border border-[#dbe6de] dark:border-zinc-700 rounded-lg text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    <span className="material-symbols-outlined text-lg">print</span>
                    Imprimir
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 border border-[#dbe6de] dark:border-zinc-700 rounded-lg text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                    Baixar PDF
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-primary text-[#111813] rounded-lg text-sm font-bold hover:brightness-95 transition-all">
                    <span className="material-symbols-outlined text-lg">edit</span>
                    Editar
                  </button>
                </div>
              </div>

              <div className="flex flex-1 overflow-hidden relative">
                {/* Secondary Sidebar: Original Text */}
                <div className="w-80 border-r border-[#dbe6de] dark:border-zinc-800 bg-[#f8faf8] dark:bg-zinc-900/40 p-6 overflow-y-auto">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-zinc-400">history_edu</span>
                    <h3 className="font-bold text-sm text-[#111813] dark:text-zinc-300 uppercase tracking-widest">Texto Original</h3>
                  </div>
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-primary italic">Mateus 2:1-3</p>
                    <div className="text-sm text-[#61896b] dark:text-zinc-400 leading-relaxed font-normal space-y-4">
                      <p>"E, tendo nascido Jesus em Belém de Judeia, no tempo do rei Herodes, eis que uns magos vieram do oriente a Jerusalém, Dizendo: Onde está aquele que é nascido rei dos judeus? porque vimos a sua estrela no oriente, e viemos a adorá-lo."</p>
                      <p>"E o rei Herodes, ouvindo isto, perturbou-se, e toda a Jerusalém com ele."</p>
                    </div>
                    <div className="mt-6 p-4 bg-white dark:bg-zinc-800 rounded-xl border border-[#dbe6de] dark:border-zinc-700">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase mb-2">Nota Teológica</p>
                      <p className="text-xs text-zinc-500">O foco da adaptação foi mantido na luz e na jornada, simplificando os conflitos políticos para a faixa etária de 1 a 3 anos.</p>
                    </div>
                  </div>
                </div>

                {/* Main Story Content */}
                <div className="flex-1 overflow-y-auto p-12 bg-white dark:bg-zinc-900 relative">
                  <div className="absolute right-8 top-8 w-56">
                    <div className="bg-yellow-50 dark:bg-zinc-800 border border-yellow-200 dark:border-zinc-700 p-4 rounded-2xl shadow-sm flex flex-col items-center text-center gap-2">
                      <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-white text-2xl mb-1">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>face_6</span>
                      </div>
                      <h5 className="text-xs font-bold text-yellow-800 dark:text-yellow-200 uppercase tracking-wider">Dica de Interação</h5>
                      <p className="text-xs text-yellow-700 dark:text-zinc-400 font-medium">Clique nas palavras coloridas para ouvir o som!</p>
                    </div>
                  </div>

                  <article className="max-w-2xl mx-auto flex flex-col items-center gap-12">
                    <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-xl ring-8 ring-[#f0f4f1] dark:ring-zinc-800">
                      <img
                        alt="Bebê sorridente apontando para uma estrela brilhante"
                        className="w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuB89eUgSLruHC-RwRPJZRWJA4xQfPTPw6aIRlDzdU0iyH5E9PrVoLN8FxZgvdYjgY6Tn9eZsTnVnrQ_UfJXNPo0ffSk0QBjl_UvandzkfbiKU1Y13uiahFEIHy25OZle0UoPcSwTh7DkiEHdV4ykLBhOSLEWszJsFN9hVxezvnFKIrizbKfPG99QHR4eC34aEOkU_7AlbbUBR7E2M5SRPrSmCWoJsqEJPc5tPKlDIKvEdfhw8cJJYKDTTHKyH0kAHDjRdBbCZtj9nQD"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>

                    <div className="font-serif-story space-y-8 text-center px-4">
                      <p className="text-4xl leading-snug text-[#111813] dark:text-white">
                        Era uma vez, no céu muito azul, uma
                        <button className="inline-flex items-center gap-1 text-yellow-500 font-bold hover:scale-105 transition-transform cursor-pointer focus:outline-none">
                          <span>estrela</span>
                          <span className="material-symbols-outlined text-lg animate-pulse">volume_up</span>
                        </button>
                        muito brilhante! Ela piscava assim: <i>plim, plim!</i>
                      </p>
                      <p className="text-4xl leading-snug text-[#111813] dark:text-white">
                        Um bebezinho muito especial nasceu em uma casinha humilde. O nome dele era
                        <button className="inline-flex items-center gap-1 text-primary font-bold hover:scale-105 transition-transform cursor-pointer focus:outline-none">
                          <span>Jesus</span>
                          <span className="material-symbols-outlined text-lg animate-pulse">volume_up</span>
                        </button>.
                      </p>
                      <p className="text-4xl leading-snug text-[#111813] dark:text-white">
                        Três amigos viram a luz e caminharam felizes para dar um abraço no bebê!
                      </p>
                    </div>

                    <div className="w-full mt-8 p-10 rounded-3xl bg-primary/5 border-2 border-dashed border-primary/20 flex flex-col items-center gap-6">
                      <h4 className="font-bold text-2xl text-[#111813] dark:text-white flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-4xl">celebration</span>
                        Onde está a estrela?
                      </h4>
                      <button className="w-24 h-24 bg-white dark:bg-zinc-800 rounded-full shadow-lg border-4 border-yellow-400 flex items-center justify-center text-yellow-500 hover:scale-110 active:scale-95 transition-all group">
                        <span className="material-symbols-outlined text-6xl group-hover:rotate-12 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      </button>
                    </div>

                    <div className="flex gap-4 pb-12">
                      <button className="w-14 h-14 rounded-full border border-[#dbe6de] flex items-center justify-center text-zinc-400 hover:text-primary hover:border-primary transition-all">
                        <span className="material-symbols-outlined">arrow_back_ios_new</span>
                      </button>
                      <button className="w-14 h-14 rounded-full bg-primary text-[#111813] flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                        <span className="material-symbols-outlined font-bold">arrow_forward_ios</span>
                      </button>
                    </div>
                  </article>
                </div>
              </div>
            </div>

            {/* Bottom Footer/Info */}
            <div className="mt-6 flex justify-between items-center px-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Página 1 de 4</span>
                <div className="w-48 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>
              <div className="text-xs text-[#61896b] dark:text-zinc-500">
                Adaptado para nível: <strong>Ninho (12-24 meses)</strong>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
