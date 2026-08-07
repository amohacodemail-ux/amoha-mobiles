import sys
import re

file_path = r'c:\Users\Vijayadharshini\amohamobiles\amoha-mobiles\frontend\src\components\ui\FilterSidebar.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Container
content = content.replace(
    'className="glass-card mb-4 overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.08]"',
    'className="mb-4 overflow-hidden rounded-[24px] border border-[#E5E7EB] dark:border-white/10 bg-[#FFFFFF] dark:bg-[#121212] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-lg dark:hover:border-white/20"'
)

# Panel
content = content.replace(
    'className="border-t border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] px-4 py-4"',
    'className="border-t border-[#E5E7EB] dark:border-white/10 bg-[#FFFFFF] dark:bg-[#121212] px-4 py-4 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]"'
)

# Top Bar Chips (True/False)
old_chip = """                ? 'border-primary-500 bg-primary-100 text-primary-700 dark:border-primary-500/50 dark:bg-primary-500/10 dark:text-primary-300'
                : 'border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-200 dark:hover:bg-white/10'"""

new_chip = """                ? 'border-[#4F46E5] bg-[#4F46E5]/10 text-[#4F46E5] dark:border-[#4F46E5]/50 dark:bg-[#4F46E5]/20 dark:text-[#4F46E5]'
                : 'border-[#E5E7EB] dark:border-white/10 bg-[#F8FAFC] dark:bg-white/5 text-[#1E293B] dark:text-white hover:border-[#4F46E5]/30 hover:bg-[#4F46E5]/5 hover:text-[#4F46E5] dark:hover:bg-[#4F46E5]/10 dark:hover:text-[#4F46E5]'"""
content = content.replace(old_chip, new_chip)

# Expanded options
old_opt = """                        ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300 dark:bg-primary-500/20 dark:text-primary-300 dark:ring-primary-500/30'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-700 dark:text-gray-200'"""

new_opt = """                        ? 'bg-[#4F46E5]/10 text-[#4F46E5] ring-1 ring-[#4F46E5]/30 dark:bg-[#4F46E5]/20 dark:text-[#4F46E5] dark:ring-[#4F46E5]/50'
                        : 'bg-[#F8FAFC] dark:bg-white/5 text-[#64748B] dark:text-gray-400 hover:bg-[#4F46E5]/5 dark:hover:bg-[#4F46E5]/10 hover:text-[#4F46E5] dark:hover:text-[#4F46E5]'"""
content = content.replace(old_opt, new_opt)

# Availability Active (same as top bar but just in case it differs)
content = content.replace(
    """                ? 'border-primary-500 bg-primary-100 text-primary-700 dark:border-primary-500/50 dark:bg-primary-500/10 dark:text-primary-300'
                : 'border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-200 dark:hover:bg-white/10'""",
    """                ? 'border-[#4F46E5] bg-[#4F46E5]/10 text-[#4F46E5] dark:border-[#4F46E5]/50 dark:bg-[#4F46E5]/20 dark:text-[#4F46E5]'
                : 'border-[#E5E7EB] dark:border-white/10 bg-[#F8FAFC] dark:bg-white/5 text-[#1E293B] dark:text-white hover:border-[#4F46E5]/30 hover:bg-[#4F46E5]/5 hover:text-[#4F46E5] dark:hover:bg-[#4F46E5]/10 dark:hover:text-[#4F46E5]'"""
)

# Availability specific (if different formatting)
content = content.replace(
    "? 'border-primary-500 bg-primary-100 text-primary-700 dark:border-primary-500/50 dark:bg-primary-500/10 dark:text-primary-300'",
    "? 'border-[#4F46E5] bg-[#4F46E5]/10 text-[#4F46E5] dark:border-[#4F46E5]/50 dark:bg-[#4F46E5]/20 dark:text-[#4F46E5]'"
)

content = content.replace(
    ": 'border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-200 dark:hover:bg-white/10'",
    ": 'border-[#E5E7EB] dark:border-white/10 bg-[#F8FAFC] dark:bg-white/5 text-[#1E293B] dark:text-white hover:border-[#4F46E5]/30 hover:bg-[#4F46E5]/5 hover:text-[#4F46E5] dark:hover:bg-[#4F46E5]/10 dark:hover:text-[#4F46E5]'"
)

content = content.replace('rounded-lg border px-3 py-2 text-sm font-medium transition-all', 'rounded-full border px-3 py-2 text-sm font-medium transition-all duration-300')
content = content.replace('rounded-lg px-3 py-2 text-sm font-medium transition-all', 'rounded-full px-3 py-2 text-sm font-medium transition-all duration-300')

content = content.replace('bg-primary-500', 'bg-[#4F46E5]')
content = content.replace('from-primary-500 to-primary-400', 'from-[#4F46E5] to-[#6366F1]')
content = content.replace('border-primary-500', 'border-[#4F46E5]')
content = content.replace('ring-primary-300', 'ring-[#4F46E5]/30')
content = content.replace('bg-primary-100', 'bg-[#4F46E5]/10')
content = content.replace('text-primary-700', 'text-[#4F46E5]')


content = content.replace(
    'className="mb-3 w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-600 outline-none transition-colors focus:border-primary-500/40"',
    'className="mb-3 w-full rounded-full border border-[#E5E7EB] dark:border-white/10 bg-[#F8FAFC] dark:bg-white/5 px-3 py-2 text-sm text-[#1E293B] dark:text-white placeholder-[#64748B] outline-none transition-colors duration-300 focus:border-[#4F46E5]/40 focus:ring-1 focus:ring-[#4F46E5]/40"'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
