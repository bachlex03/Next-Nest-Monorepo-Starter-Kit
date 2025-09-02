import localFont from 'next/font/local'

export const robotoMono = localFont({
  src: [
    {
      path: '../../public/fonts/Roboto_Mono/RobotoMono-Thin.ttf',
      weight: '100',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Roboto_Mono/RobotoMono-ThinItalic.ttf',
      weight: '100',
      style: 'italic',
    },
    {
      path: '../../public/fonts/Roboto_Mono/RobotoMono-ExtraLight.ttf',
      weight: '200',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Roboto_Mono/RobotoMono-ExtraLightItalic.ttf',
      weight: '200',
      style: 'italic',
    },
    {
      path: '../../public/fonts/Roboto_Mono/RobotoMono-Light.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Roboto_Mono/RobotoMono-LightItalic.ttf',
      weight: '300',
      style: 'italic',
    },
    {
      path: '../../public/fonts/Roboto_Mono/RobotoMono-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Roboto_Mono/RobotoMono-Italic.ttf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../../public/fonts/Roboto_Mono/RobotoMono-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Roboto_Mono/RobotoMono-MediumItalic.ttf',
      weight: '500',
      style: 'italic',
    },
    {
      path: '../../public/fonts/Roboto_Mono/RobotoMono-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Roboto_Mono/RobotoMono-SemiBoldItalic.ttf',
      weight: '600',
      style: 'italic',
    },
    {
      path: '../../public/fonts/Roboto_Mono/RobotoMono-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Roboto_Mono/RobotoMono-BoldItalic.ttf',
      weight: '700',
      style: 'italic',
    },
  ],
  variable: '--font-roboto-mono',
  display: 'swap',
})
