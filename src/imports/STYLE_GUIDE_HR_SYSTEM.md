# دليل التصميم الشامل — نظام HR بنفس أسلوب نور النبراس CRM
## Style Guide & Design Tokens for Figma Replication

---

## 1. الثيمات (Themes)

النظام يدعم **3 ثيمات** (الأساسي `:root` + `.dark` + `.light-turquoise`):

### 1.1 الثيم الأساسي (Root / Dark Gold)
| Token | القيمة | الاستخدام |
|---|---|---|
| `--background` | `#0A0A0A` | خلفية الصفحة الرئيسية |
| `--foreground` | `#F5F5F5` | لون النص الأساسي |
| `--card` | `#1A1A1A` | خلفية البطاقات |
| `--card-foreground` | `#F5F5F5` | نص البطاقات |
| `--popover` | `#1A1A1A` | خلفية القوائم المنبثقة |
| `--popover-foreground` | `#F5F5F5` | نص القوائم المنبثقة |
| `--primary` | `#D4AF37` | اللون الذهبي الأساسي (Accent) |
| `--primary-foreground` | `#0A0A0A` | نص فوق الذهبي |
| `--secondary` | `#2A2A2A` | خلفية العناصر الثانوية |
| `--secondary-foreground` | `#F5F5F5` | نص العناصر الثانوية |
| `--muted` | `#1F1F1F` | خلفية العناصر الصامتة |
| `--muted-foreground` | `#A0A0A0` | نص رمادي فاتح |
| `--accent` | `#F7E7CE` | لون الشمبانيا (Champagne) |
| `--accent-foreground` | `#0A0A0A` | نص فوق الشمبانيا |
| `--destructive` | `#DC2626` | لون التحذير/الحذف (أحمر) |
| `--destructive-foreground` | `#FFFFFF` | نص فوق الأحمر |
| `--border` | `rgba(212, 175, 55, 0.2)` | حدود ذهبية شفافة |
| `--input` | `rgba(212, 175, 55, 0.1)` | خلفية حقول الإدخال |
| `--input-background` | `#1A1A1A` | خلفية الـ Input |
| `--switch-background` | `#2A2A2A` | خلفية الـ Switch |
| `--ring` | `#D4AF37` | حلقة التركيز (Focus Ring) |

### 1.2 الثيم الداكن المحسّن (.dark)
| Token | القيمة | الفرق عن Root |
|---|---|---|
| `--background` | `#050505` | أغمق |
| `--foreground` | `#FFF8E1` | أصفر فاتح دافئ |
| `--card` | `#0F0F0F` | أغمق |
| `--primary` | `#F0C419` | ذهبي أكثر سطوعاً |
| `--primary-foreground` | `#000000` | أسود |
| `--secondary` | `#1F1F1F` | — |
| `--muted` | `#1A1A1A` | — |
| `--muted-foreground` | `#B0A080` | بيج داكن |
| `--border` | `rgba(240, 196, 25, 0.2)` | — |

### 1.3 الثيم الفاتح (.light-turquoise)
| Token | القيمة | الاستخدام |
|---|---|---|
| `--background` | `#FFFFFF` | خلفية بيضاء |
| `--foreground` | `#0F172A` | نص داكن (Slate 900) |
| `--card` | `#FFFFFF` | بطاقات بيضاء |
| `--primary` | `#06B6D4` | فيروزي (Cyan 500) |
| `--primary-foreground` | `#FFFFFF` | نص أبيض |
| `--secondary` | `#F0FDFF` | فيروزي فاتح جداً |
| `--muted` | `#F1F5F9` | Slate 100 |
| `--muted-foreground` | `#64748B` | Slate 500 |
| `--accent` | `#ECFEFF` | Cyan 50 |
| `--border` | `rgba(6, 182, 212, 0.2)` | حدود فيروزية شفافة |
| `--input` | `rgba(6, 182, 212, 0.1)` | — |
| `--input-background` | `#F9FAFB` | Gray 50 |
| `--switch-background` | `#E2E8F0` | Slate 200 |
| `--ring` | `#06B6D4` | — |

---

## 2. ألوان خاصة و Gradients

### 2.1 ألوان ذهبية إضافية (Dark Theme)
| Token | القيمة |
|---|---|
| `--gold` | `#FFD700` |
| `--champagne` | `#FDF5E6` |
| `--gold-dark` | `#B8860B` |

### 2.2 Gold Gradient (للنصوص والأزرار)
```css
--gold-gradient: linear-gradient(
  to right,
  #BF953F 0%,
  #FCF6BA 25%,
  #B38728 50%,
  #FBF5B7 75%,
  #AA771C 100%
);
```
**استخدام:** كلاس `.text-gradient-gold` يطبق `background-clip: text` مع أنيميشن `shine` يتحرك كل 8 ثواني.

### 2.3 ألوان فيروزية إضافية (Light Theme)
| الدور | القيمة |
|---|---|
| `--gold` (يتحول) | `#06B6D4` |
| `--gold-dark` (يتحول) | `#0891B2` |
| Gradient | `linear-gradient(to right, #06B6D4, #06B6D4)` |

### 2.4 ألوان الرسوم البيانية (Charts)
| الثيم | Chart 1 | Chart 2 | Chart 3 | Chart 4 | Chart 5 |
|---|---|---|---|---|---|
| **Dark Gold** | `#D4AF37` | `#F7E7CE` | `#B8941F` | `#8B7355` | `#DCC6A0` |
| **Light Turquoise** | `#06B6D4` | `#67E8F9` | `#0891B2` | `#164E63` | `#A5F3FC` |

---

## 3. Neumorphic / Glassmorphic Tokens

### 3.1 أسطح Neumorphic (لصفحة Login والعناصر البارزة)

#### Dark Neumorphic:
| Token | القيمة |
|---|---|
| Surface | `#1a1a2e` |
| Surface Light | `#22223a` |
| Surface Dark | `#10101e` |
| Shadow Light | `rgba(50,50,80,0.35)` |
| Shadow Dark | `rgba(0,0,0,0.65)` |
| Inset Light | `rgba(50,50,80,0.25)` |
| Inset Dark | `rgba(0,0,0,0.5)` |
| Card Glow | `rgba(212,175,55,0.08)` |
| Page Background | `#12121e` |

#### Light Neumorphic:
| Token | القيمة |
|---|---|
| Surface | `#e3edf2` |
| Surface Light | `#ffffff` |
| Surface Dark | `#c8d5dc` |
| Shadow Light | `rgba(255,255,255,0.85)` |
| Shadow Dark | `rgba(165,180,195,0.45)` |
| Inset Light | `rgba(255,255,255,0.7)` |
| Inset Dark | `rgba(165,180,195,0.3)` |
| Card Glow | `rgba(6,182,212,0.06)` |
| Page Background | `#e8f0f4` |

### 3.2 صيغ الظلال Neumorphic:
```css
/* Outer (بارز) */
box-shadow: 8px 8px 20px {shadowDark}, -8px -8px 20px {shadowLight};

/* Outer Small */
box-shadow: 4px 4px 10px {shadowDark}, -4px -4px 10px {shadowLight};

/* Inset (غائر) */
box-shadow: inset 3px 3px 8px {insetDark}, inset -3px -3px 8px {insetLight};

/* Pressed (مضغوط) */
box-shadow: inset 2px 2px 6px {insetDark}, inset -2px -2px 6px {insetLight};
```

### 3.3 Glassmorphic (للبطاقات العامة):
```css
/* Card base */
backdrop-filter: blur(4px); /* backdrop-blur-sm */
background: var(--card);
border: 1px solid var(--border);
box-shadow: 0 10px 15px rgba(0,0,0,0.1); /* shadow-lg */
```

---

## 4. Typography (الخطوط)

### 4.1 الخط الأساسي
```
Font Family: 'Tajawal', sans-serif
Source: Google Fonts
Weights: 300 (Light), 400 (Regular), 500 (Medium), 700 (Bold), 800 (ExtraBold), 900 (Black)
```

### 4.2 أحجام الخطوط الأساسية
| العنصر | الحجم | الوزن | ارتفاع السطر |
|---|---|---|---|
| `html` base | `16px` | — | — |
| `h1` | `--text-2xl` (≈24px) | 500 (Medium) | 1.5 |
| `h2` | `--text-xl` (≈20px) | 500 | 1.5 |
| `h3` | `--text-lg` (≈18px) | 500 | 1.5 |
| `h4` | `--text-base` (≈16px) | 500 | 1.5 |
| `label` | `--text-base` | 500 | 1.5 |
| `button` | `--text-base` | 500 | 1.5 |
| `input` | `--text-base` | 400 (Normal) | 1.5 |

### 4.3 تضخيم الخطوط الصغيرة (Global Override)
النظام يرفع أحجام الخطوط الصغيرة تلقائياً:
| الكلاس الأصلي | الحجم الفعلي المعروض |
|---|---|
| `text-[9px]` | `11px` |
| `text-[10px]` | `12px` |
| `text-[11px]` | `13px` |

---

## 5. أنصاف الأقطار (Border Radius)

| Token | القيمة | الاستخدام |
|---|---|---|
| `--radius` (base) | `0.75rem` (12px) | الأساسي |
| `--radius-sm` | `calc(0.75rem - 4px)` = 8px | عناصر صغيرة |
| `--radius-md` | `calc(0.75rem - 2px)` = 10px | عناصر متوسطة |
| `--radius-lg` | `0.75rem` = 12px | بطاقات |
| `--radius-xl` | `calc(0.75rem + 4px)` = 16px | عناصر كبيرة |

**ملاحظة:** البطاقات تستخدم `rounded-xl` (16px)، الأزرار تستخدم `rounded-lg` (12px)، البادجات `rounded-md` (8px).

---

## 6. الشريط الجانبي (Sidebar)

### 6.1 ألوان الشريط الجانبي
| الثيم | Token | القيمة |
|---|---|---|
| **Dark Gold** | `--sidebar` | `#0F0F0F` |
| | `--sidebar-foreground` | `#F5F5F5` |
| | `--sidebar-primary` | `#D4AF37` |
| | `--sidebar-accent` | `#1A1A1A` |
| | `--sidebar-border` | `rgba(212, 175, 55, 0.2)` |
| **Light Turquoise** | `--sidebar` | `#F8FAFC` |
| | `--sidebar-foreground` | `#0F172A` |
| | `--sidebar-primary` | `#06B6D4` |
| | `--sidebar-accent` | `#F0FDFF` |
| | `--sidebar-border` | `rgba(6, 182, 212, 0.2)` |

### 6.2 هيكل الشريط الجانبي
```
Width: 256px (w-64)
Border: border-e (inline-end) بلون sidebar-border
Background overlay: gradient from primary/5 via transparent to accent/5
```

### 6.3 عنصر القائمة (Menu Item)
```
Padding: px-4 py-2.5
Border Radius: rounded-lg (12px)
Gap: gap-3 (12px)
Icon size: w-5 h-5 (20px)

Active state:
  - bg-primary text-primary-foreground
  - shadow-lg shadow-primary/20
  - Gradient overlay: from-primary via-primary to-gold-dark

Hover state:
  - bg-sidebar-accent text-sidebar-accent-foreground
  - Motion: x shift -5px

Animation:
  - Staggered entry: delay = index * 0.05s
  - Direction: x: 20 → 0 (RTL: slides from left)
```

---

## 7. المكوّنات الأساسية (UI Components)

### 7.1 Card (البطاقة)
```css
border-radius: rounded-xl (16px)
border: 1px solid var(--border)
background: var(--card)
color: var(--card-foreground)
box-shadow: shadow-lg
backdrop-filter: backdrop-blur-sm

/* Hover state (stat cards): */
hover:shadow-2xl hover:shadow-primary/10
hover:border-primary/40
hover:y: -5px (Motion)
```

### 7.2 Button (الزر)
#### Variants:
| Variant | الأسلوب |
|---|---|
| **Default** | `bg-primary text-primary-foreground hover:bg-gold-dark shadow-lg shadow-primary/20` |
| **Secondary** | `bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border` |
| **Outline** | `border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground` |
| **Ghost** | `hover:bg-secondary hover:text-secondary-foreground` (بدون خلفية) |
| **Destructive** | `bg-destructive text-destructive-foreground hover:bg-destructive/90` |

#### Sizes:
| Size | الأبعاد |
|---|---|
| **Default** | `h-11 px-6 py-3` (44px height) |
| **Small** | `h-9 px-4 py-2` (36px height) |
| **Large** | `h-12 px-8 py-4` (48px height) |
| **Icon** | `h-11 w-11` (44×44px) |

### 7.3 Input (حقل الإدخال)
```css
height: h-11 (44px)
border-radius: rounded-lg (12px)
border: 1px solid var(--border)
background: var(--input-background)
padding: px-4 py-3

Focus:
  ring: 2px var(--ring)
  border-color: var(--primary)
```

### 7.4 Badge (الشارة)
```css
border-radius: rounded-md (8px)
padding: px-2 py-0.5
font-size: text-xs
```
Variants: `default`, `secondary`, `destructive`, `outline`

### 7.5 Dialog / Drawer
```css
Overlay: bg-black/80 (80% opacity)
Content background: var(--card) / bg-popover
Border: border-border
Border radius: rounded-xl (16px)
Shadow: shadow-lg
```

---

## 8. الخلفية المتحركة (Animated Background)

ثلاث كرات (Orbs) متحركة بـ `radial-gradient` و `blur`:

| Orb | الحجم | اللون | Blur | الحركة |
|---|---|---|---|---|
| **Top-right** | 600×600px | `rgba(240, 196, 25, 0.15)` | 60px | x: 0↔100, y: 0↔50, scale: 1↔1.1, dur: 20s |
| **Bottom-left** | 500×500px | `rgba(253, 245, 230, 0.1)` | 80px | x: 0↔-80, y: 0↔-60, scale: 1↔1.2, dur: 25s |
| **Center** | 400×400px | `rgba(240, 196, 25, 0.08)` | 70px | scale: 1↔1.3, dur: 15s |

---

## 9. الأنيميشنات المخصصة (Custom Animations)

### 9.1 Keyframes المعرّفة
| الاسم | الوصف | المدة |
|---|---|---|
| `shimmer` | بريق ذهبي يتحرك أفقياً (-1000px → 1000px) | 2s infinite |
| `float` | طفو عمودي (0 → -10px → 0) | 3s ease-in-out infinite |
| `glow` | توهج ذهبي متنبض (box-shadow 20px↔30px) | 2s ease-in-out infinite |
| `shine` | تحريك خلفية الـ gradient (background-position: 0 → 200%) | 8s linear infinite |

### 9.2 أنماط Motion الشائعة
```tsx
// دخول تسلسلي (Staggered Entry)
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ delay: index * 0.1, duration: 0.5 }}

// Hover ارتفاع
whileHover={{ y: -5 }}

// Spring Pop
transition={{ type: "spring", stiffness: 300, damping: 30 }}

// Hover تكبير + دوران (للأيقونات)
whileHover={{ scale: 1.1, rotate: 5 }}

// أنيميشن نبضي (للخلفيات)
animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
```

---

## 10. RTL & Logical Properties

### 10.1 الاتجاه العام
```
dir="rtl" على الحاوية الرئيسية
font-family: 'Tajawal', sans-serif (عربي)
```

### 10.2 Logical Properties المستخدمة
| Physical (ممنوع) | Logical (مستخدم) |
|---|---|
| `margin-left` / `margin-right` | `ms-*` / `me-*` (margin-inline-start/end) |
| `padding-left` / `padding-right` | `ps-*` / `pe-*` (padding-inline-start/end) |
| `border-left` / `border-right` | `border-s` / `border-e` (border-inline-start/end) |
| `text-left` / `text-right` | `text-start` / `text-end` |
| `left` / `right` | `start` / `end` |

### 10.3 Scrollbar Fix
```css
[dir="rtl"] [data-radix-scroll-area-scrollbar][data-orientation="vertical"] {
  left: auto !important;
  right: 0 !important;
}
```

---

## 11. الألوان الممنوعة والمسموحة

### ممنوع استخدامها:
- `amber-*` (جميع درجات الـ Amber)
- `orange-*` (جميع درجات الـ Orange)
- علامة `$` للعملة (يُستبدل بـ `د.ع`)

### ألوان الحالات الوظيفية:
| الحالة | اللون |
|---|---|
| Critical / حرج | `red-500` / `red-400` (Dark) |
| Warning / تحذير | `--primary` (ذهبي أو فيروزي حسب الثيم) |
| Normal / طبيعي | `emerald-500` / `emerald-400` |
| Surplus / فائض | `blue-500` / `blue-400` |
| Success / نجاح | `green-500` / `emerald-500` |
| Destructive / خطر | `--destructive` (`#DC2626`) |

---

## 12. أنماط البطاقات الشائعة (Card Patterns)

### 12.1 بطاقة الإحصائيات (Stat Card)
```
- خلفية: bg-card مع backdrop-blur-sm
- حدود: border-border
- أيقونة: داخل p-2.5 rounded-lg bg-primary/10 border border-primary/20
- الرقم: text-3xl مع .text-gradient-gold
- التغيير: badge أخضر (صعود) أو أحمر (هبوط) بـ TrendingUp / TrendingDown
- زخرفة: gradient orb أعلى اليمين (primary/10 → transparent)
```

### 12.2 بطاقة المحتوى (Content Card)
```
- bg-card/30 backdrop-blur-md border-border/40
- CardHeader: p-6 مع CardTitle text-sm
- CardContent: p-6 pt-0
```

### 12.3 البطاقة المسطحة (Flat Panel) — للأقسام الداخلية
```
- p-4 rounded-xl
- border border-slate-200/70 dark:border-white/[0.06]
- bg-white/60 dark:bg-white/[0.03]
- shadow-sm
```

---

## 13. أنماط البادج/الشارة الشائعة

### حالة خطورة المخزون:
```tsx
// Pastel badges
Critical: "bg-red-50/80 dark:bg-red-500/[0.08] border-red-200/50 dark:border-red-500/15 text-red-500 dark:text-red-400"
Warning:  "bg-primary/[0.06] dark:bg-primary/[0.08] border-primary/20 dark:border-primary/15 text-primary"
Normal:   "bg-emerald-50/80 dark:bg-emerald-500/[0.08] border-emerald-200/50 dark:border-emerald-500/15 text-emerald-600 dark:text-emerald-400"
Surplus:  "bg-blue-50/80 dark:bg-blue-500/[0.08] border-blue-200/50 dark:border-blue-500/15 text-blue-500 dark:text-blue-400"
```

---

## 14. أيقونات النظام (Lucide React)

**مكتبة الأيقونات:** `lucide-react` فقط — ممنوع استخدام الإيموجي

### أيقونات الأقسام الرئيسية:
| القسم | الأيقونة |
|---|---|
| لوحة التحكم | `Home` |
| العملاء | `Users` |
| المنتجات | `Package` |
| الطلبات | `ShoppingBag` |
| القنوات الموحدة | `MessageSquareDot` |
| التذاكر | `Ticket` |
| الموظفون | `UserCog` |
| خط المبيعات | `Target` |
| التنبؤات | `TrendingUp` |
| سلسلة التوريد | `Container` |
| العروض | `Megaphone` |
| التحليلات | `BarChart3` |
| قاعدة المعرفة | `BookMarked` |
| مركز الاتصال | `Headset` |
| سجل الأحداث | `ScrollText` |
| لوحة المشرف | `ShieldCheck` |
| الإعدادات | `Settings` |

### أحجام الأيقونات الشائعة:
| السياق | الحجم |
|---|---|
| Sidebar Menu | `w-5 h-5` (20px) |
| Card Header / Action | `w-4 h-4` (16px) |
| KPI / Stat | `w-5 h-5` (20px) |
| Small inline | `w-3.5 h-3.5` (14px) |
| Tiny indicator | `w-3 h-3` (12px) |

---

## 15. العملة والتنسيق

### العملة العراقية (IQD):
```tsx
const IQD_SUFFIX = " د.ع";
const formatIQD = (val: number) => `${val.toLocaleString("ar-IQ")}${IQD_SUFFIX}`;

// الاستخدام:
<span dir="ltr">{formatIQD(1500000)}</span>
// النتيجة: "١٬٥٠٠٬٠٠٠ د.ع"
```

### اللهجة: عراقية
مثال: "منتجات حرجة"، "تكلفة التزويد المقترح"، "أيام متبقية"

---

## 16. شريط الأدوات العلوي (Top Bar)

```
- خلفية: bg-card/80 backdrop-blur-md
- حدود سفلية: border-b border-border
- ارتفاع: ≈ 60px
- عناصر: ترحيب + اقتباس ملهم (يتغير كل ساعة) + بحث + أيقونات (Bell, MessageSquare, Settings)
- Notification badge: bg-destructive h-4 w-4 absolute -top-1 -end-1 rounded-full text-[9px]
```

---

## 17. الجداول (Tables)

```
- Header: bg-muted/20 مع text-[11px]
- Rows: border-border/20 hover:bg-muted/10
- Text alignment: text-start (logical)
- Color indicators: vertical bar w-1.5 h-8 rounded-full بلون الحالة
- Stock bars: h-1.5 rounded-full bg-muted/30 مع inner div بلون الحالة
```

---

## 18. الحزم المستخدمة (Dependencies)

| الحزمة | الإصدار | الاستخدام |
|---|---|---|
| `react` | 18.3.1 | الإطار الأساسي |
| `tailwindcss` | 4.x | التنسيق |
| `motion` | latest | أنيميشنات (`motion/react`) |
| `lucide-react` | latest | الأيقونات |
| `recharts` | latest | الرسوم البيانية |
| `@radix-ui/*` | latest | مكوّنات UI أساسية |
| `class-variance-authority` | latest | إدارة variants |
| `three` | 0.170.0 | ثلاثي الأبعاد (مباشرة بدون react-three) |
| `sonner` | latest | الإشعارات Toast |

---

## 19. القواعد التقنية الأساسية (Code Rules)

1. **ممنوع:** `amber`/`orange` colors
2. **ممنوع:** `React.Fragment` — استخدم `flatMap` بدلاً منه
3. **ممنوع:** `@react-three/fiber` أو `@react-three/drei` — استخدم `three.js` مباشرة
4. **ممنوع:** `$` للعملة — استخدم `formatIQD()` فقط
5. **ممنوع:** Emoji في الواجهة — استخدم Lucide React فقط
6. **واجب:** Logical Properties بدل Physical (`ms-*` بدل `ml-*`)
7. **واجب:** `dir="rtl"` على الحاويات الرئيسية
8. **واجب:** خط Tajawal لجميع النصوص
9. **واجب:** لهجة عراقية لجميع النصوص العربية
10. **واجب:** `dir="ltr"` على الأرقام المالية وأكواد المنتجات

---

## 20. ملخص لوحة ألوان سريعة (Quick Color Palette)

### Dark Gold Theme:
```
Page BG:     #0A0A0A → #050505
Card BG:     #1A1A1A → #0F0F0F
Sidebar:     #0F0F0F
Primary:     #D4AF37 → #F0C419
Gold Grad:   #BF953F → #FCF6BA → #B38728 → #FBF5B7 → #AA771C
Text:        #F5F5F5 → #FFF8E1
Muted Text:  #A0A0A0 → #B0A080
Border:      rgba(212,175,55, 0.2)
Neumorphic:  #1a1a2e surface
```

### Light Turquoise Theme:
```
Page BG:     #FFFFFF
Card BG:     #FFFFFF
Sidebar:     #F8FAFC
Primary:     #06B6D4
Accent:      #ECFEFF
Text:        #0F172A
Muted Text:  #64748B
Border:      rgba(6,182,212, 0.2)
Neumorphic:  #e3edf2 surface
```
