interface AppleSignInButtonProps {
  onClick: () => void;
}

export function AppleSignInButton({ onClick }: AppleSignInButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-black py-2.5 text-sm font-semibold text-white hover:opacity-90">
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="currentColor"
        aria-hidden="true">
        <path d="M16.365 1.43c0 1.14-.416 2.06-1.246 2.83-.888.83-1.96 1.31-2.94 1.23-.086-1.09.42-2.19 1.19-2.9.83-.77 2.06-1.28 2.996-1.16zM20.6 17.24c-.526 1.19-.775 1.72-1.45 2.77-.94 1.46-2.27 3.28-3.92 3.3-1.47.02-1.85-.96-3.84-.95-1.99.01-2.41.97-3.88.95-1.65-.02-2.91-1.66-3.85-3.12-2.64-4.06-2.92-8.83-1.29-11.37 1.16-1.8 2.99-2.85 4.71-2.85 1.75 0 2.85 1 4.3 1 1.4 0 2.26-1 4.3-1 1.53 0 3.15.83 4.3 2.27-3.78 2.07-3.17 7.45.6 8.98z" />
      </svg>
      Masuk dengan Apple
    </button>
  );
}
