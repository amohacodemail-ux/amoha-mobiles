import re

def format_terms(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update the sidebar
    sidebar_old = '''          <div className="hidden lg:block w-72 flex-shrink-0 sticky top-24 overflow-y-auto max-h-[calc(100vh-8rem)] scrollbar-hide">
            <div className="pr-6 pb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-4 pl-4">On this page</h3>
              <nav className="space-y-1 relative before:absolute before:inset-y-0 before:left-4 before:w-px before:bg-gray-200 dark:before:bg-white/10">
                {headings.map((heading) => (
                  <button
                    key={heading.id}
                    onClick={() => scrollToSection(heading.id)}
                    className={`relative w-full text-left px-4 py-2 pl-8 text-sm transition-all duration-200 ${activeSection === heading.id
                        ? 'text-primary-600 dark:text-primary-400 font-semibold'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:translate-x-1'
                      }`}
                  >
                    {activeSection === heading.id && (
                      <span className="absolute left-[15.5px] top-1/2 -translate-y-1/2 w-0.5 h-full bg-primary-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                    )}
                    {heading.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>'''
          
    sidebar_new = '''          <div className="hidden lg:block w-72 flex-shrink-0 sticky top-24 overflow-y-auto max-h-[calc(100vh-8rem)] scrollbar-hide">
            <div className="p-6 bg-white/60 dark:bg-surface-50/60 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg shadow-gray-200/20 dark:shadow-black/40">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-6 pl-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
                On this page
              </h3>
              <nav className="space-y-1 relative before:absolute before:inset-y-0 before:left-4 before:w-px before:bg-gray-200 dark:before:bg-white/10">
                {headings.map((heading) => (
                  <button
                    key={heading.id}
                    onClick={() => scrollToSection(heading.id)}
                    className={`relative w-full text-left px-4 py-2.5 pl-8 text-sm transition-all duration-300 rounded-lg ${
                      activeSection === heading.id
                        ? 'text-primary-700 dark:text-primary-400 font-bold bg-primary-50/50 dark:bg-primary-900/10'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 hover:translate-x-1'
                    }`}
                  >
                    {activeSection === heading.id && (
                      <span className="absolute left-[15.5px] top-1/2 -translate-y-1/2 w-0.5 h-[60%] bg-primary-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                    )}
                    {heading.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>'''
    
    content = content.replace(sidebar_old, sidebar_new)

    # 2. Update the Preamble
    preamble_old = '''            <div className="bg-white dark:bg-surface-50 p-6 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500" />
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400">
                  <HiOutlineShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    These Terms of Service (&quot;<strong className="text-gray-800 dark:text-gray-200 font-semibold">Terms</strong>&quot;) constitute a legally binding agreement between you (&quot;<strong className="text-gray-800 dark:text-gray-200 font-semibold">User</strong>&quot;, &quot;you&quot;, &quot;your&quot;) and <strong className="text-gray-800 dark:text-gray-200 font-semibold">AMOHA Mobiles</strong> (&quot;Company&quot;, &quot;we&quot;, &quot;our&quot;, &quot;us&quot;) governing your access to and use of our website located at <span className="text-primary-600 dark:text-primary-400 font-medium">www.amoha.in</span> and all related services offered by us. By accessing, browsing, or using our website, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree, you must immediately discontinue use of our services.
                  </p>
                </div>
              </div>
            </div>'''
            
    preamble_new = '''            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-surface-50 dark:to-surface-100 p-8 rounded-3xl border border-gray-200/80 dark:border-white/10 shadow-md relative overflow-hidden group hover:shadow-lg transition-all duration-500">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary-400 to-indigo-600 rounded-l-3xl" />
              <div className="absolute top-0 right-0 p-16 opacity-5 dark:opacity-10 pointer-events-none transition-transform duration-700 group-hover:scale-110">
                 <HiOutlineShieldCheck className="w-32 h-32" />
              </div>
              <div className="flex items-start gap-5 relative z-10">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-surface-50 text-primary-600 dark:text-primary-400 shadow-sm border border-gray-100 dark:border-white/5">
                  <HiOutlineShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                    These Terms of Service (&quot;<strong className="text-gray-900 dark:text-white font-bold">Terms</strong>&quot;) constitute a legally binding agreement between you (&quot;<strong className="text-gray-900 dark:text-white font-bold">User</strong>&quot;, &quot;you&quot;, &quot;your&quot;) and <strong className="text-gray-900 dark:text-white font-bold">AMOHA Mobiles</strong> (&quot;Company&quot;, &quot;we&quot;, &quot;our&quot;, &quot;us&quot;) governing your access to and use of our website located at <span className="text-primary-600 dark:text-primary-400 font-semibold bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-md">www.amoha.in</span> and all related services offered by us. By accessing, browsing, or using our website, you acknowledge that you have read, understood, and agree to be bound by these Terms.
                  </p>
                </div>
              </div>
            </div>'''
            
    content = content.replace(preamble_old, preamble_new)

    # 3. Update the main wrapper around the sections
    content = content.replace(
        '<div className="bg-white dark:bg-surface-50 p-6 sm:p-10 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm space-y-12">',
        '<div className="space-y-8">'
    )

    # Remove hr tags
    content = re.sub(r'<hr className="border-gray-100 dark:border-white/5"\s*/>', '', content)

    # 4. Update the sections
    def section_replacer(match):
        sec_id = match.group(1)
        # using actual newline
        return f'<section id="{sec_id}" className="scroll-mt-28 group bg-white dark:bg-surface-50 p-6 sm:p-10 rounded-[2rem] border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 dark:hover:shadow-black/60 transition-all duration-500 relative overflow-hidden">\n                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary-400 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-l-[2rem]"></div>'

    content = re.sub(r'<section id="(sec-\d+)" className="scroll-mt-28">', section_replacer, content)

    # 5. Update the titles and badges
    content = content.replace(
        '<h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">',
        '<h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-4 transition-transform duration-300 group-hover:translate-x-1">'
    )
    
    content = re.sub(
        r'<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">(\d+)</span>',
        r'<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-900/20 dark:to-indigo-900/20 text-primary-600 dark:text-primary-400 text-base font-bold shadow-sm border border-primary-100 dark:border-primary-800/30">\1</span>',
        content
    )

    # 6. Update the text body margin
    content = content.replace(
        '<div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-11">',
        '<div className="text-[15px] text-gray-600 dark:text-gray-400 leading-relaxed ml-14 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">'
    )
    
    # Also update the space-y-8 in payment methods to match
    content = content.replace(
        '<div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-11 space-y-8">',
        '<div className="text-[15px] text-gray-600 dark:text-gray-400 leading-relaxed ml-14 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300 space-y-8">'
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

format_terms('frontend/src/app/terms/TermsOfServiceClient.tsx')
