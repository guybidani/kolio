import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>
      <SignUp
        appearance={{
          elements: {
            rootBox: 'mx-auto relative z-10',
            card: 'shadow-xl bg-[#12121A] border border-white/10',
          },
        }}
      />
    </div>
  )
}
