<script lang="ts">
  let menuActive = false;
  const onBurgerButton = (e: Event) => {
    e.preventDefault();
    menuActive = !menuActive;
  };
</script>

<nav class="navbar" aria-label="main navigation">
  <div class="navbar-brand">
    <a class="navbar-item" href="https://bulma.io">
      <img alt="" src="https://bulma.io/images/bulma-logo.png" width="112" height="28" />
    </a>

    <a
      role="button"
      class="navbar-burger"
      class:is-active={menuActive}
      aria-label="menu"
      aria-expanded="false"
      data-target="navbarBasicExample"
      href="/"
      on:click={onBurgerButton}
    >
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
    </a>
  </div>

  <div id="navbarBasicExample" class="navbar-menu" class:is-active={menuActive}>
    <div class="navbar-start">
      <a href="/" class="navbar-item"> Home </a>

      <a href="/" class="navbar-item"> Documentation </a>

      <div class="navbar-item has-dropdown is-hoverable">
        <a href="/" class="navbar-link"> More </a>

        <div class="navbar-dropdown">
          <a href="/" class="navbar-item"> About </a>
          <a href="/" class="navbar-item"> Jobs </a>
          <a href="/" class="navbar-item"> Contact </a>
          <hr class="navbar-divider" />
          <a href="/" class="navbar-item"> Report an issue </a>
        </div>
      </div>
    </div>

    <div class="navbar-end">
      <div class="navbar-item">
        <div class="buttons">
          <a href="/" class="button is-primary">
            <strong>Sign up</strong>
          </a>
          <a href="/" class="button is-light"> Log in </a>
        </div>
      </div>
    </div>
  </div>
</nav>

<section class="section">
  <div class="container">
    <h1 class="title">Hello World</h1>
    <p class="subtitle">
      My first website with <strong>Bulma</strong>!
    </p>

    <span class="icon-text">
      <span class="icon">
        <i class="fas fa-home"></i>
      </span>
      <span>Home</span>
    </span>

    <button class="button is-primary">Button</button>
    <a href="/" class="button">Anchor</a>
    <button class="button">Button</button>
    <input class="button" type="submit" value="Submit input" />
    <input class="button" type="reset" value="Reset input" />

    <button class="button is-white">White</button>
    <button class="button is-light">Light</button>
    <button class="button is-dark">Dark</button>
    <button class="button is-black">Black</button>
    <button class="button is-text">Text</button>
    <button class="button is-ghost">Ghost</button>
  </div>
</section>
