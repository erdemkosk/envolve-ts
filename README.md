![alt text](./logo.png)

# Envolve - Manage Your .env Files with Ease

Envolve is a command-line tool designed to simplify the management of `.env` files in your projects. It helps you collect, organize, and modify your environment variables across multiple projects, ensuring that you can easily handle your configuration data without the risk of losing it when you delete or archive your projects.

## Motivation

In today's software development world, projects can accumulate numerous .env files. As you create and work on different projects, managing these files can become a challenging task. There are several common issues developers face:

1. **Disorganization**: Multiple .env files scattered across various project folders can lead to disorganization and confusion.

2. **Configuration Changes**: Over time, you may need to update environment variables across multiple projects. Manually making these changes in each .env file is tedious and error-prone.

3. **Data Loss**: When you delete or archive a project, you risk losing the associated .env files and their crucial configuration data.

## Envolve's Solution

Envolve aims to address these issues by providing a streamlined solution:

1. **Centralization**: Envolve centralizes all your .env files in a dedicated folder, making it easy to find and manage them.

2. **Bulk Updates**: You can make changes to environment variables across multiple projects with a single command.

3. **Symlink Support**: Envolve allows you to create symbolic links to your .env files, ensuring that you don't lose crucial configuration data when projects are deleted or archived.

4. **Visualization**: With Envolve, you can view the content of .env files in an organized tabular format for better clarity.

5. **Comparison**: Envolve can compare two .env files and highlight the differences, making it easier to identify changes in your configuration.

## Commands
ls: LIST environment variables in an .env file for a specific service. Select a service and view its environment variables.

sync: SYNC backs up your current project's .env file, restores the variables from a global .env file, and creates a symbolic link to the latest environment settings. This command is invaluable for maintaining consistency and easily switching between environment configurations while working on different projects.

ua or update-all: The UPDATE-ALL command is a handy utility for updating a specific environment variable across multiple service-specific .env files. You'll be prompted to enter the old and new values, and then it will automatically update these values in all relevant service .env files.

comp or compare: The COMPARE command is a handy utility for differences in two different files with the same variable.

c or create: CREATE a new env file for a specific service.

cp or copy: COPY an .env file to the current folder as a symlink.

u or update: UPDATE a single .env file for a specific service.



## Contributors

A big thank you to all the contributors who have helped make Envolve better:

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/erdemkosk">
        <img src="https://github.com/erdemkosk.png" width="100px;" alt="erdemkosk"/>
        <br />
        <sub><b>Erdem Köşk</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/suleymantaspinar">
        <img src="https://github.com/suleymantaspinar.png" width="100px;" alt="suleymantaspinar"/>
        <br />
        <sub><b>Süleyman Taşpınar</b></sub>
      </a>
    </td>
  </tr>
</table>