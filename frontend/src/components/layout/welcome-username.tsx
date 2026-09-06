export function WelcomeBanner({ username }: { username: string }) {
  return (
    <div className="rounded-xl border-2 border-gold bg-olive px-8 py-6 mb-6">
      <h1 className="title-display text-xl md:text-2xl text-cream">Selamat Pagi, {username}</h1>
    </div>
  );
}
