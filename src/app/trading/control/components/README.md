# Custom Range Slider Component

## Mô tả
CustomRangeSlider là một component React được thiết kế theo format như trong ảnh, với các marker tùy chỉnh và visual feedback mượt mà.

## Tính năng
- ✅ Slider với các marker tùy chỉnh (0%, 25%, 50%, 75%, 100%)
- ✅ Click vào marker để chọn giá trị
- ✅ Click vào track để chọn giá trị
- ✅ Drag để thay đổi giá trị
- ✅ Visual feedback với animation mượt mà
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Accessibility support

## Cài đặt
```bash
npm install react-range
```

## Sử dụng

### Basic Usage
```tsx
import { CustomRangeSlider } from './components/CustomRangeSlider';

function MyComponent() {
  const [value, setValue] = useState(0);

  return (
    <CustomRangeSlider
      value={value}
      onChange={setValue}
      min={0}
      max={100}
      step={1}
      marks={[0, 25, 50, 75, 100]}
    />
  );
}
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | - | Giá trị hiện tại của slider |
| `onChange` | `(value: number) => void` | - | Callback khi giá trị thay đổi |
| `min` | `number` | `0` | Giá trị tối thiểu |
| `max` | `number` | `100` | Giá trị tối đa |
| `step` | `number` | `1` | Bước nhảy |
| `marks` | `number[]` | `[0, 25, 50, 75, 100]` | Các marker hiển thị |

## Demo
Chạy component demo để test:
```tsx
import { CustomRangeSliderDemo } from './components/CustomRangeSliderDemo';

// Trong route hoặc component
<CustomRangeSliderDemo />
```

## Styling
Component sử dụng Tailwind CSS classes và có thể tùy chỉnh thông qua:
- Dark mode classes
- Hover effects
- Transition animations
- Focus states

## Accessibility
- Keyboard navigation support
- Screen reader friendly
- ARIA labels
- Focus management 